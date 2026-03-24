import { Kokoro } from "./Kokoro";
import { LanguageEnum, type SceneInput } from "../../types/shorts";
import { AiLlmGenerator } from "../../script-generator/AiLlmGenerator";

const languageVoiceMap: Record<LanguageEnum, string> = {
  [LanguageEnum.en]: "af_heart",
  [LanguageEnum.hi]: "af_nova",
  [LanguageEnum.es]: "af_sarah",
  [LanguageEnum.auto]: "af_heart",
};

export class TtsAdapter {
  private translator: AiLlmGenerator;

  constructor(private kokoro: Kokoro) {
    this.translator = new AiLlmGenerator();
  }

  private async translateIfNeeded(scene: SceneInput): Promise<string> {
    if (!scene.translationTarget || scene.translationTarget === scene.language || scene.language === LanguageEnum.auto) {
      return scene.text;
    }

    try {
      return await this.translator.translateText(scene.text, scene.language, scene.translationTarget);
    } catch (error) {
      // Fallback to original text if translation fails
      return scene.text;
    }
  }

  async synthesize(scene: SceneInput): Promise<{ audio: ArrayBuffer; audioLength: number }> {
    const voiceKey = languageVoiceMap[scene.language] || languageVoiceMap[LanguageEnum.en];
    const text = await this.translateIfNeeded(scene);
    return this.kokoro.generate(text, voiceKey as any);
  }
}
