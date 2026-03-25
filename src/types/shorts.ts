import z from "zod";

export enum MusicMoodEnum {
  sad = "sad",
  melancholic = "melancholic",
  happy = "happy",
  euphoric = "euphoric/high",
  excited = "excited",
  chill = "chill",
  uneasy = "uneasy",
  angry = "angry",
  dark = "dark",
  hopeful = "hopeful",
  contemplative = "contemplative",
  funny = "funny/quirky",
}

export enum CaptionPositionEnum {
  top = "top",
  center = "center",
  bottom = "bottom",
}

export enum LanguageEnum {
  en = "en",
  hi = "hi",
  es = "es",
  auto = "auto",
}

export type Scene = {
  captions: Caption[];
  headline?: string;
  video?: string;
  imageUrl?: string;
  visualPrompt?: string;
  audio: {
    url: string;
    duration: number;
  };
};

export const sceneInput = z.object({
  text: z.string()
    .min(10, "Scene text must be at least 10 characters")
    .max(500, "Scene text must not exceed 500 characters")
    .describe("Text to be spoken in the video - should be conversational and engaging"),
  searchTerms: z
    .array(z.string().min(1).max(50))
    .min(2, "At least 2 search terms required per scene")
    .max(10, "Maximum 10 search terms per scene")
    .describe(
      "Search terms for video content. Provide 2-5 relevant keywords that match the scene's context and visual theme.",
    ),
  headline: z.string()
    .min(5, "Headline must be at least 5 characters")
    .max(100, "Headline must not exceed 100 characters")
    .optional()
    .describe("Compelling headline for the scene that captures attention"),
  visualPrompt: z.string()
    .min(10, "Visual prompt must be at least 10 characters")
    .max(200, "Visual prompt must not exceed 200 characters")
    .optional()
    .describe("Detailed description for AI image generation - include style, mood, and specific visual elements"),
  language: z
    .nativeEnum(LanguageEnum)
    .default(LanguageEnum.en)
    .describe("TTS language for the scene"),
  translationTarget: z
    .nativeEnum(LanguageEnum)
    .optional()
    .describe("Optional translation target language for text before TTS"),
  cues: z
    .array(
      z.object({
        startMs: z.number().min(0),
        endMs: z.number().min(0),
        label: z.string().min(1).max(120).optional(),
        brollSearchTerms: z.array(z.string().min(1).max(50)).optional(),
      }),
    )
    .optional()
    .describe("Optional scene timing cues for chaptering and B-roll hints"),
});
export type SceneInput = z.infer<typeof sceneInput>;

export enum VoiceEnum {
  af_heart = "af_heart",
  af_alloy = "af_alloy",
  af_aoede = "af_aoede",
  af_bella = "af_bella",
  af_jessica = "af_jessica",
  af_kore = "af_kore",
  af_nicole = "af_nicole",
  af_nova = "af_nova",
  af_river = "af_river",
  af_sarah = "af_sarah",
  af_sky = "af_sky",
  am_adam = "am_adam",
  am_echo = "am_echo",
  am_eric = "am_eric",
  am_fenrir = "am_fenrir",
  am_liam = "am_liam",
  am_michael = "am_michael",
  am_onyx = "am_onyx",
  am_puck = "am_puck",
  am_santa = "am_santa",
  bf_emma = "bf_emma",
  bf_isabella = "bf_isabella",
  bm_george = "bm_george",
  bm_lewis = "bm_lewis",
  bf_alice = "bf_alice",
  bf_lily = "bf_lily",
  bm_daniel = "bm_daniel",
  bm_fable = "bm_fable",
}

export enum OrientationEnum {
  landscape = "landscape",
  portrait = "portrait",
}

export enum VideoTypeEnum {
  short = "short",
  long = "long",
}

export type VideoType = `${VideoTypeEnum}`;

export enum MusicVolumeEnum {
  muted = "muted",
  low = "low",
  medium = "medium",
  high = "high",
}

export const renderConfig = z.object({
  paddingBack: z
    .number()
    .min(0, "Padding must be non-negative")
    .max(10000, "Padding must not exceed 10 seconds")
    .default(1500)
    .describe(
      "Duration in milliseconds to continue video after speech ends. Recommended: 1500ms.",
    ),
  music: z
    .nativeEnum(MusicMoodEnum)
    .default(MusicMoodEnum.chill)
    .describe("Music mood that matches the video's emotional tone"),
  captionPosition: z
    .nativeEnum(CaptionPositionEnum)
    .default(CaptionPositionEnum.bottom)
    .describe("Caption placement for optimal readability"),
  captionBackgroundColor: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$|^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$|^rgba\(\d{1,3},\s*\d{1,3},\s*\d{1,3},\s*[0-1]?\.?\d*\)$|^[a-zA-Z]+$/, "Invalid color format - use hex (#FFF), rgb(), rgba(), or color name")
    .default("#0066CC")
    .describe("Caption background color for better text visibility"),
  voice: z
    .nativeEnum(VoiceEnum)
    .default(VoiceEnum.af_heart)
    .describe("Voice actor for natural speech synthesis"),
  orientation: z
    .nativeEnum(OrientationEnum)
    .default(OrientationEnum.portrait)
    .describe("Video aspect ratio - portrait for mobile, landscape for desktop"),
  musicVolume: z
    .nativeEnum(MusicVolumeEnum)
    .default(MusicVolumeEnum.medium)
    .describe("Background music volume level"),
  useAiImages: z
    .boolean()
    .default(false)
    .describe("Use AI-generated images instead of stock videos for custom visuals"),
  videoType: z
    .nativeEnum(VideoTypeEnum)
    .default(VideoTypeEnum.short)
    .describe("Render mode: short or long"),
  durationLimit: z
    .number()
    .min(15)
    .max(3600)
    .default(180)
    .describe("Target maximum output duration in seconds before auto-splitting"),
});
export type RenderConfig = z.infer<typeof renderConfig>;

export type Voices = `${VoiceEnum}`;

export type Video = {
  id: string;
  url: string;
  width: number;
  height: number;
};
export type Caption = {
  text: string;
  startMs: number;
  endMs: number;
};

export type CaptionLine = {
  texts: Caption[];
};
export type CaptionPage = {
  startMs: number;
  endMs: number;
  lines: CaptionLine[];
};

export const createShortInput = z.object({
  scenes: z.array(sceneInput)
    .min(1, "At least 1 scene required")
    .max(20, "Maximum 20 scenes allowed for video length constraints")
    .describe("Video scenes in sequential order - each scene should flow naturally to the next"),
  config: renderConfig.describe("Video rendering configuration - affects style, audio, and presentation"),
}).refine((data) => {
  // Business logic validation: ensure total text length is reasonable for video duration
  const totalTextLength = data.scenes.reduce((sum, scene) => sum + scene.text.length, 0);
  const estimatedDuration = totalTextLength * 0.05; // Rough estimate: 50ms per character for speech
  
  if (estimatedDuration > 120) { // 2 minutes max
    return false;
  }
  
  return true;
}, {
  message: "Total video content too long - estimated duration exceeds 2 minutes. Reduce scene count or text length.",
});
export type CreateShortInput = z.infer<typeof createShortInput>;

export type VideoStatus = "processing" | "ready" | "failed";

export type Music = {
  file: string;
  start: number;
  end: number;
  mood: string;
};
export type MusicForVideo = Music & {
  url: string;
};

export type MusicTag = `${MusicMoodEnum}`;

export type kokoroModelPrecision = "fp32" | "fp16" | "q8" | "q4" | "q4f16";

export const videoIdSchema = z.string()
  .regex(/^[a-zA-Z0-9_-]{8,}$/, "Video ID must be at least 8 characters with only letters, numbers, hyphens, and underscores")
  .describe("Unique identifier for video processing jobs");

export const statusRequestSchema = z.object({
  videoId: videoIdSchema,
});

export type StatusRequest = z.infer<typeof statusRequestSchema>;

// ─── Phase 4: Queue Job Status Types ────────────────────────────────────────
export type RenderJobStatus =
  | "scheduled"
  | "queued"
  | "processing"
  | "ready"
  | "rendered"
  | "failed"
  | "skipped";

export type PublishJobStatus =
  | "scheduled"
  | "queued"
  | "publishing"
  | "published"
  | "failed"
  | "skipped";

// ─── Phase 5: Platform Publisher Types ──────────────────────────────────────
export type PlatformType = "youtube" | "telegram" | "instagram" | "facebook";

// ─── Phase 4/5: Render Job DB Record ─────────────────────────────────────────
export interface RenderJobRecord {
  id: string;
  scriptPlanId: string;
  videoType: VideoType;
  language: string;
  subtitleLanguage: string;
  orientation: OrientationEnum;
  category: string;
  status: RenderJobStatus;
  attemptCount: number;
  outputPath: string | null;
  namingKey: string;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Phase 5: Publish Job DB Record ──────────────────────────────────────────
export interface PublishJobRecord {
  id: string;
  renderOutputPath: string;
  platform: PlatformType;
  channelId: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  language: string;
  thumbnailPath?: string;
  scheduleAt: string | null;
  status: PublishJobStatus;
  attemptCount: number;
  externalId: string | null;
  publishedUrl: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublishAttemptRecord {
  id: string;
  publishJobId: string;
  attemptNumber: number;
  status: "success" | "failed";
  responseCode: number | null;
  responseBody: string | null;
  attemptedAt: string;
}

// ─── Phase 5: Channel Config ──────────────────────────────────────────────────
export interface ChannelConfig {
  id: string;
  platform: PlatformType;
  channelName: string;
  credentialsKey: string;
  categories: string[];
  languageProfiles: LanguageProfile[];
  active: boolean;
}

export interface LanguageProfile {
  audio: string;
  subtitle: string;
  voice: string;
  whisperModel: string;
}

// ─── Phase 6: Category Rules ──────────────────────────────────────────────────
export interface CategoryRule {
  id: string;
  category: string;
  channels: string[];
  languageProfiles: LanguageProfile[];
  videoTypes: VideoType[];
  maxDurationShortSec: number;
  maxDurationLongSec: number;
  active: boolean;
}

export type whisperModels = "tiny" | "tiny.en" | "base" | "base.en" | "small" | "small.en" | "medium" | "medium.en" | "large-v1" | "large-v2" | "large-v3" | "large-v3-turbo";
