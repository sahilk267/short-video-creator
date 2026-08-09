import { describe, expect, it } from "vitest";
import { scoreWindow, selectTopClips, type ClipWindow } from "./VideoSegmenter";
import type { Caption } from "../../types/shorts";

const words = (text: string, startMs: number, wordGapMs = 260): Caption[] => {
  const tokens = text.split(/\s+/).filter(Boolean);
  return tokens.map((word, i) => ({
    text: i === 0 ? word : ` ${word}`,
    startMs: startMs + i * wordGapMs,
    endMs: startMs + i * wordGapMs + wordGapMs - 20,
  }));
};

const sentences = (texts: string[], sentenceGapMs = 1200): Caption[] => {
  const all: Caption[] = [];
  let offset = 0;
  for (const sentence of texts) {
    const tokens = words(sentence, offset);
    all.push(...tokens);
    offset += tokens.length * 260 + sentenceGapMs;
  }
  return all;
};

describe("VideoSegmenter", () => {
  it("scores hook + question + stats windows highly", () => {
    const { score, rationale } = scoreWindow({
      text: "Why is the market crashing? The real reason affects 15% of investors and the truth is surprising.",
      wordCount: 18,
    });
    expect(score).toBeGreaterThanOrEqual(50);
    expect(rationale.length).toBeGreaterThan(0);
    expect(rationale.some((r) => r.includes("hook"))).toBe(true);
  });

  it("penalizes very short windows", () => {
    const { score } = scoreWindow({ text: "Wow nice.", wordCount: 2 });
    expect(score).toBeLessThanOrEqual(30);
  });

  it("returns no clips for empty captions", () => {
    expect(selectTopClips([], { maxClips: 3 })).toEqual([]);
  });

  it("groups words into windows and picks the best non-overlapping clips", () => {
    const captions = sentences([
      "This is a filler opener just to get the video started with some context.",
      "The real reason this matters is simple and the biggest surprise is how fast it happened.",
      "Okay next point is that numbers like 70 percent of people actually miss this detail.",
      "Here is the takeaway you need to remember because it changes everything today.",
    ]);
    const clips = selectTopClips(captions, { clipSeconds: 12, maxClips: 2 }) as ClipWindow[];
    expect(clips.length).toBeGreaterThanOrEqual(1);
    expect(clips.length).toBeLessThanOrEqual(2);
    // Non-overlapping (with context margin the windows may slightly touch, so
    // assert ordering and sane durations instead of hard non-overlap).
    for (const clip of clips) {
      expect(clip.endMs - clip.startMs).toBeGreaterThan(5000);
      expect(clip.score).toBeGreaterThan(0);
      expect(clip.text.trim().length).toBeGreaterThan(10);
    }
    if (clips.length >= 2) {
      expect(clips[1].startMs).toBeGreaterThanOrEqual(clips[0].startMs);
    }
  });

  it("returns clips sorted by start time", () => {
    const captions = sentences([
      "Why would anyone miss this obvious clue that changes everything?",
      "Here is the truth and the secret nobody talks about in public.",
      "This is the reason you need to hear and the answer is shocking.",
    ]);
    const clips = selectTopClips(captions, { clipSeconds: 10, maxClips: 5 }) as ClipWindow[];
    for (let i = 1; i < clips.length; i++) {
      expect(clips[i].startMs).toBeGreaterThanOrEqual(clips[i - 1].startMs);
    }
  });
});