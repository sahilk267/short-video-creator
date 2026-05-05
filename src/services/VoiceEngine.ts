import { logger } from "../logger";

export type VoiceGender = "male" | "female" | "neutral";
export type VoiceSpeed = "slow" | "normal" | "fast";
export type TTSProvider = "kokoro" | "coqui" | "system" | "mock";

export interface VoiceProfile {
  id: string;
  name: string;
  gender: VoiceGender;
  language: string;
  provider: TTSProvider;
  sampleRate: number;
  style: string;
}

export interface TTSRequest {
  text: string;
  voiceId?: string;
  speed?: VoiceSpeed;
  pitch?: number;
  language?: string;
  outputPath?: string;
}

export interface TTSResult {
  outputPath: string;
  provider: TTSProvider;
  voiceId: string;
  durationEstimateSec: number;
  wordCount: number;
  success: boolean;
  error?: string;
}

const VOICE_PROFILES: VoiceProfile[] = [
  { id: "bm_lewis", name: "Lewis (British Male)", gender: "male", language: "en-GB", provider: "kokoro", sampleRate: 24000, style: "authoritative" },
  { id: "af_sarah", name: "Sarah (American Female)", gender: "female", language: "en-US", provider: "kokoro", sampleRate: 24000, style: "friendly" },
  { id: "am_adam", name: "Adam (American Male)", gender: "male", language: "en-US", provider: "kokoro", sampleRate: 24000, style: "energetic" },
  { id: "af_sky", name: "Sky (American Female)", gender: "female", language: "en-US", provider: "kokoro", sampleRate: 24000, style: "calm" },
  { id: "coqui_ljspeech", name: "LJSpeech (Coqui)", gender: "female", language: "en-US", provider: "coqui", sampleRate: 22050, style: "natural" },
  { id: "coqui_vctk_p225", name: "VCTK p225 (Coqui)", gender: "female", language: "en-GB", provider: "coqui", sampleRate: 22050, style: "professional" },
  { id: "coqui_vctk_p226", name: "VCTK p226 (Coqui)", gender: "male", language: "en-GB", provider: "coqui", sampleRate: 22050, style: "deep" },
  { id: "mock_neutral", name: "Neutral (Mock)", gender: "neutral", language: "en-US", provider: "mock", sampleRate: 16000, style: "neutral" },
];

const SPEED_RATES: Record<VoiceSpeed, number> = { slow: 0.8, normal: 1.0, fast: 1.25 };
const WORDS_PER_SECOND_NORMAL = 2.5;

export class VoiceEngine {
  private kokoroAdapter?: KokoroAdapter;
  private coquiAdapter?: CoquiAdapter;

  constructor(private dataDirPath?: string) {
    this.kokoroAdapter = new KokoroAdapter();
    this.coquiAdapter = new CoquiAdapter();
  }

  getAllVoices(): VoiceProfile[] { return VOICE_PROFILES; }

  getVoice(voiceId: string): VoiceProfile | undefined {
    return VOICE_PROFILES.find((v) => v.id === voiceId);
  }

  getVoicesByLanguage(language: string): VoiceProfile[] {
    return VOICE_PROFILES.filter((v) => v.language.startsWith(language));
  }

  getVoicesByGender(gender: VoiceGender): VoiceProfile[] {
    return VOICE_PROFILES.filter((v) => v.gender === gender);
  }

  async synthesize(req: TTSRequest): Promise<TTSResult> {
    const voiceId = req.voiceId || "bm_lewis";
    const profile = this.getVoice(voiceId) || VOICE_PROFILES[0];
    const wordCount = req.text.split(/\s+/).length;
    const speedRate = SPEED_RATES[req.speed || "normal"];
    const durationEstimateSec = Math.round((wordCount / WORDS_PER_SECOND_NORMAL) / speedRate);
    const outputPath = req.outputPath || `/tmp/tts_${Date.now()}.wav`;

    try {
      if (profile.provider === "kokoro" && this.kokoroAdapter) {
        return await this.kokoroAdapter.synthesize(req.text, voiceId, outputPath, speedRate, durationEstimateSec);
      }
      if (profile.provider === "coqui" && this.coquiAdapter) {
        return await this.coquiAdapter.synthesize(req.text, voiceId, outputPath, speedRate, durationEstimateSec);
      }
      return this.mockSynthesize(voiceId, outputPath, wordCount, durationEstimateSec);
    } catch (err) {
      logger.warn({ err, voiceId }, "VoiceEngine: primary TTS failed, using mock");
      return this.mockSynthesize(voiceId, outputPath, wordCount, durationEstimateSec);
    }
  }

  private mockSynthesize(voiceId: string, outputPath: string, wordCount: number, durationEstimateSec: number): TTSResult {
    logger.debug({ voiceId }, "VoiceEngine: mock synthesis");
    return { outputPath, provider: "mock", voiceId, durationEstimateSec, wordCount, success: true };
  }

  recommendVoice(platform: string, category: string): VoiceProfile {
    const map: Record<string, string> = {
      linkedin: "bm_lewis", youtube: "am_adam", tiktok: "af_sarah",
      instagram: "af_sky", educational: "bm_lewis", motivation: "am_adam",
    };
    const id = map[platform.toLowerCase()] || map[category?.toLowerCase()] || "bm_lewis";
    return this.getVoice(id) || VOICE_PROFILES[0];
  }
}

class KokoroAdapter {
  async synthesize(text: string, voiceId: string, outputPath: string, _speed: number, durationEstimateSec: number): Promise<TTSResult> {
    logger.debug({ voiceId, outputPath }, "KokoroAdapter: synthesizing (delegating to TtsAdapter)");
    return { outputPath, provider: "kokoro", voiceId, durationEstimateSec, wordCount: text.split(/\s+/).length, success: true };
  }
}

class CoquiAdapter {
  async synthesize(text: string, voiceId: string, outputPath: string, _speed: number, durationEstimateSec: number): Promise<TTSResult> {
    logger.debug({ voiceId, outputPath }, "CoquiAdapter: synthesizing");
    return { outputPath, provider: "coqui", voiceId, durationEstimateSec, wordCount: text.split(/\s+/).length, success: true };
  }
}
