import { Kokoro } from "./Kokoro";
import { LanguageEnum, type SceneInput, type Voices } from "../../types/shorts";
import { AiLlmGenerator } from "../../script-generator/AiLlmGenerator";
import { defaultVoiceForLanguage } from "../../config/languageSupport";

export class TtsAdapter {
  private translator: AiLlmGenerator;

  constructor(
    private kokoro: Kokoro,
    aiLlmUrl?: string,
    aiLlmModel?: string,
  ) {
    this.translator = new AiLlmGenerator(aiLlmUrl, aiLlmModel);
  }

  private async translateIfNeeded(scene: SceneInput): Promise<string> {
    if (scene.narrationText?.trim()) {
      return scene.narrationText.trim();
    }

    const sourceLanguage = scene.sourceLanguage || scene.language;
    const targetLanguage = scene.language;

    if (!targetLanguage || sourceLanguage === targetLanguage || targetLanguage === LanguageEnum.auto) {
      return scene.text;
    }

    try {
      return await this.translator.translateText(scene.text, sourceLanguage, targetLanguage);
    } catch (error) {
      if (sourceLanguage !== targetLanguage && targetLanguage !== LanguageEnum.en) {
        throw new Error(`Narration translation failed for ${sourceLanguage} -> ${targetLanguage}`);
      }
      return scene.text;
    }
  }

  private async prepareTextForSpeech(
    text: string,
    targetLanguage: LanguageEnum,
  ): Promise<string> {
    if (!text.trim()) {
      return text;
    }

    return text;
  }

  async synthesize(
    scene: SceneInput,
    preferredVoice?: Voices,
  ): Promise<{ audio: ArrayBuffer; audioLength: number }> {
    const targetLanguage = scene.language || LanguageEnum.en;
    const voiceKey = preferredVoice || defaultVoiceForLanguage(targetLanguage);
    const translatedText = await this.translateIfNeeded(scene);
    const speechReadyText = await this.prepareTextForSpeech(translatedText, targetLanguage);
    return this.kokoro.generate(speechReadyText, voiceKey as any);
  }
}
