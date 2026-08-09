/**
 * VideoSegmenter – pure, deterministic short-clip scoring logic.
 *
 * Turns a Whisper word-level transcript into candidate clips and picks the
 * most "short-form worthy" segments without any paid/cloud processing:
 *   - groups words into natural sentence windows (pause + sentence aware),
 *   - scores each window with lightweight engagement heuristics
 *     (hooks, questions, numbers/stats, contrast phrases, punchy length),
 *   - returns the top N non-overlapping windows.
 *
 * No LLM calls, no network: everything here is local string/number logic so
 * it is unit-testable and runs offline. The actual ffmpeg cutting lives in
 * the RepurposeEngine.
 */
import type { Caption } from "../../types/shorts";

export interface ClipWindow {
  startMs: number;
  endMs: number;
  text: string;
  score: number;
  rationale: string[];
  wordCount: number;
}

export interface SegmentOptions {
  /** Target clip length in seconds (default 20). */
  clipSeconds?: number;
  /** Allow windows shorter than clipSeconds only if bounded by long pauses. */
  minSeconds?: number;
  /** Number of clips to return (default 3). */
  maxClips?: number;
}

const HOOK_PHRASES = [
  "why",
  "what",
  "how",
  "the real",
  "the truth",
  "actually",
  "here is",
  "here's",
  "secret",
  "never",
  "this is",
  "that is",
  "you need",
  "wait",
  "watch",
  "listen",
  "imagine",
  "did you know",
  "you won't believe",
  "the reason",
  "breaking",
  "biggest",
  "best",
  "worst",
  "most",
];

const CONTRAST_PHRASES = [
  "but",
  "however",
  "yet",
  "instead",
  "turns out",
  "surprisingly",
  "despite",
  "although",
  "suddenly",
];

const STAT_PATTERN = /\d+(\s*[%$]|\s*(percent|billion|million|thousand|degrees|points|triathlon|stock|points))\b/;

const FILLER_WORDS = new Set([
  "uh",
  "um",
  "er",
  "hmm",
  "like",
  "you know",
  "basically",
  "actually",
  "right",
  "so",
  "well",
  "okay",
]);

const maxGapMs = 1400;

const normalizeWord = (word: string): string =>
  word.toLowerCase().replace(/[^a-z0-9'-]/g, "");

const countWords = (text: string): number => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.filter((word) => {
    const normalized = normalizeWord(word);
    return normalized.length > 1 && !FILLER_WORDS.has(normalized);
  }).length;
};

const endsSentence = (text: string): boolean => /[.!?…"]\s*$/.test(text.trim());

function buildRawWindows(
  captions: Caption[],
  clipMs: number,
  maxGapMs: number,
): ClipWindow[] {
  const windows: ClipWindow[] = [];
  let windowStart = 0;
  let windowEnd = 0;
  let windowWords: string[] = [];

  const flush = () => {
    const text = windowWords.join(" ").trim();
    if (text && windowEnd - windowStart >= 2500) {
      windows.push({
        startMs: windowStart,
        endMs: windowEnd,
        text,
        score: 0,
        rationale: [],
        wordCount: countWords(text),
      });
    }
    windowWords = [];
  };

  captions.forEach((caption, index) => {
    const word = caption.text.trim();
    if (!word) return;

    if (windowWords.length === 0) {
      windowStart = caption.startMs;
      windowEnd = caption.endMs;
      windowWords = [word];
      return;
    }

    const gap = caption.startMs - windowEnd;
    const overLength = windowEnd - windowStart >= clipMs;
    const sentential = endsSentence(windowWords.join(" "));
    const lastWord = normalizeWord(windowWords[windowWords.length - 1]);

    // Close the window on a long pause OR at clip length boundary.
    if (gap > maxGapMs && sentential) {
      flush();
      windowStart = caption.startMs;
      windowEnd = caption.endMs;
      windowWords = [word];
      return;
    }

    if (sentential && overLength && lastWord.length > 0) {
      flush();
      windowStart = caption.startMs;
      windowEnd = caption.endMs;
      windowWords = [word];
      return;
    }

    windowWords.push(word);
    windowEnd = caption.endMs;

    // Hard cap: never exceed ~1.5x the clip length in one window.
    if (windowEnd - windowStart > clipMs * 1.5 && index > 0) {
      flush();
      windowStart = windowEnd;
      windowWords = [];
    }
  });

  flush();
  return windows;
}

/** Score a single window with lightweight engagement heuristics. */
export function scoreWindow(window: Pick<ClipWindow, "text" | "wordCount">): {
  score: number;
  rationale: string[];
} {
  const text = window.text.toLowerCase();
  const rationales: string[] = [];
  let score = 0;

  const hookHits = HOOK_PHRASES.filter((phrase) => text.includes(phrase)).length;
  if (hookHits > 0) {
    score += Math.min(30, hookHits * 7);
    rationales.push(`hook phrases (${hookHits})`);
  }

  if (/\?/.test(window.text)) {
    score += 12;
    rationales.push("question");
  }
  if (/!/.test(window.text)) {
    score += 6;
    rationales.push("exclamation");
  }

  const statHit = STAT_PATTERN.test(window.text);
  if (statHit) {
    score += 14;
    rationales.push("stats/numbers");
  }

  const contrastHits = CONTRAST_PHRASES.filter((phrase) => text.includes(phrase)).length;
  if (contrastHits > 0) {
    score += Math.min(18, contrastHits * 6);
    rationales.push("contrast");
  }

  const words = window.wordCount;
  if (words >= 18 && words <= 45) {
    score += 20;
    rationales.push("punchy length");
  } else if (words >= 10 && words <= 70) {
    score += 10;
    rationales.push("usable length");
  } else {
    rationales.push("length issues");
  }

  if (words > 0 && words < 8) {
    score -= 25;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    rationale: rationales.slice(0, 3),
  };
}

function addContext(
  window: ClipWindow,
  contextMs: number,
  source?: ClipWindow,
): ClipWindow {
  return {
    ...window,
    startMs: Math.max(0, window.startMs - contextMs),
    endMs: (source ? source.endMs : window.endMs) + contextMs,
  };
}

/**
 * Pick up to maxClips non-overlapping windows. Context is added only to the
 * returned clip; the original windows are non-overlapping.
 */
export function selectTopClips(
  captions: Caption[],
  options: SegmentOptions = {},
): ClipWindow[] {
  const clipSeconds = options.clipSeconds ?? 20;
  const maxClips = options.maxClips ?? 3;
  const minSeconds = options.minSeconds ?? 8;
  const clipMs = clipSeconds * 1000;
  const minMs = minSeconds * 1000;
  const contextMs = Math.min(1200, Math.round(clipMs * 0.06));

  if (!captions || captions.length === 0) {
    return [];
  }

  const raw = buildRawWindows(captions, clipMs, maxGapMs);
  const scored = raw
    .map((window) => {
      const { score, rationale } = scoreWindow(window);
      return { ...window, score, rationale };
    })
    .filter((window) => window.wordCount >= 8)
    .sort((a, b) => b.score - a.score);

  const selected: ClipWindow[] = [];
  const reserved: Array<[number, number]> = [];

  for (const window of scored) {
    if (selected.length >= maxClips) break;
    const durationMs = window.endMs - window.startMs;
    if (durationMs < minMs) continue;

    const marginMs = 800;
    const overlaps = reserved.some(
      ([s, e]) =>
        window.startMs + marginMs < e && window.endMs - marginMs > s,
    );
    if (overlaps) continue;

    reserved.push([window.startMs, window.endMs]);
    selected.push(addContext(window, contextMs));
  }

  return selected.sort((a, b) => a.startMs - b.startMs);
}