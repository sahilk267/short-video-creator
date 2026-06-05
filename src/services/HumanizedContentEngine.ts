/* eslint-disable @remotion/deterministic-randomness */

import fs from "fs-extra";
import path from "path";
import { logger } from "../logger";

export interface HumanizationConfig {
  talkingHeadAvatar?: boolean;
  reactionClips?: boolean;
  aiVoiceWithEmotion?: boolean;
  animatedCharacter?: string;
  pauseVariation: number;
  paceVariation: number;
  gestureFrequency: number;
  eyeContactLevel: number;
}

export interface HumanizedOutput {
  talkingHeadEnabled: boolean;
  emotionTone: "excited" | "calm" | "urgent" | "informative" | "humorous";
  pauseMilliseconds: number[];
  voiceSettings: { pitch: number; speed: number; emotion: string };
  gesturePoints: Array<{ time: number; gesture: string }>;
  eyeMovement: Array<{ time: number; direction: string }>;
}

export class HumanizedContentEngine {
  private dataPath: string;
  private defaultConfig: HumanizationConfig = {
    talkingHeadAvatar: true,
    reactionClips: true,
    aiVoiceWithEmotion: true,
    pauseVariation: 0.1,
    paceVariation: 0.15,
    gestureFrequency: 3,
    eyeContactLevel: 8,
  };

  constructor(dataDirPath: string) {
    this.dataPath = path.join(dataDirPath, "humanization-config.json");
  }

  humanizeContent(script: string, emotion: "excited" | "calm" | "urgent" | "informative" | "humorous" = "excited"): HumanizedOutput {
    const sentences = script.split(/[.!?]+/).filter((s) => s.trim());
    const pauseMilliseconds: number[] = [];
    const gesturePoints: Array<{ time: number; gesture: string }> = [];
    const eyeMovement: Array<{ time: number; direction: string }> = [];

    let currentTime = 0;
    const emotionSettings: Record<string, { pitch: number; speed: number }> = {
      excited: { pitch: 1.15, speed: 1.2 },
      calm: { pitch: 0.95, speed: 0.9 },
      urgent: { pitch: 1.1, speed: 1.3 },
      informative: { pitch: 1.0, speed: 1.0 },
      humorous: { pitch: 1.05, speed: 1.1 },
    };

    sentences.forEach((sentence, idx) => {
      const wordCount = sentence.trim().split(" ").length;
      const basePause = 300 + wordCount * 100;
      const randomVariation = (Math.random() - 0.5) * basePause * 0.2;
      pauseMilliseconds.push(basePause + randomVariation);

      if (idx % 3 === 0) {
        gesturePoints.push({
          time: currentTime,
          gesture: ["point", "wave", "emphasize"][Math.floor(Math.random() * 3)],
        });
      }

      if (idx % 2 === 0) {
        eyeMovement.push({
          time: currentTime,
          direction: ["left", "right", "center"][Math.floor(Math.random() * 3)],
        });
      }

      currentTime += basePause + 500;
    });

    const settings = emotionSettings[emotion];
    return {
      talkingHeadEnabled: true,
      emotionTone: emotion,
      pauseMilliseconds,
      voiceSettings: { pitch: settings.pitch, speed: settings.speed, emotion },
      gesturePoints,
      eyeMovement,
    };
  }

  getConfig(): HumanizationConfig {
    try {
      if (fs.existsSync(this.dataPath)) {
        return fs.readJsonSync(this.dataPath);
      }
    } catch {
      logger.warn("Failed to load humanization config, using defaults");
    }
    return this.defaultConfig;
  }

  saveConfig(config: HumanizationConfig): void {
    try {
      fs.ensureFileSync(this.dataPath);
      fs.writeJsonSync(this.dataPath, config, { spaces: 2 });
    } catch (err) {
      logger.error({ err }, "Failed to save humanization config");
    }
  }

  generateAvatarDirectives(emotion: string, duration: number): string {
    const directives: Record<string, string[]> = {
      excited: [
        "raise_eyebrows",
        "nod_head",
        "open_mouth_smile",
        "hand_gesture_emphasis",
        "forward_lean",
      ],
      calm: ["relax_shoulders", "slow_blink", "gentle_nod", "hand_rest", "neutral_expression"],
      urgent: ["wide_eyes", "rapid_nod", "pointing", "forward_lean", "active_mouth"],
      humorous: [
        "eyebrow_raise",
        "head_tilt",
        "smile_wink",
        "hand_wave",
        "shoulder_shrug",
      ],
    };

    const selected = directives[emotion] || directives.excited;
    const intervals = Math.ceil(duration / 1000);
    const result: string[] = [];

    for (let i = 0; i < intervals; i++) {
      result.push(selected[i % selected.length]);
    }
    return result.join(", ");
  }
}
