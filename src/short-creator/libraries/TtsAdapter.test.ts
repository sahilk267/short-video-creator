import { test, expect, vi } from "vitest";
import { TtsAdapter } from "./TtsAdapter";
import { Kokoro } from "./Kokoro";
import { LanguageEnum, SceneInput } from "../../types/shorts";
import { AiLlmGenerator } from "../../script-generator/AiLlmGenerator";

vi.mock("../../script-generator/AiLlmGenerator", () => {
  return {
    AiLlmGenerator: vi.fn().mockImplementation(() => ({
      translateText: vi.fn().mockResolvedValue("Translated text"),
    })),
  };
});

test("TtsAdapter should translate text when translationTarget differs from language", async () => {
  const kokoro = {
    generate: vi.fn().mockResolvedValue({ audio: new ArrayBuffer(4), audioLength: 2 }),
  } as any as Kokoro;

  const adapter = new TtsAdapter(kokoro);

  const scene: SceneInput = {
    text: "Hello world",
    searchTerms: ["hello", "world"],
    language: LanguageEnum.hi,
    translationTarget: LanguageEnum.en,
  };

  const result = await adapter.synthesize(scene);

  expect(result.audioLength).toBe(2);
  expect(kokoro.generate).toHaveBeenCalledWith("Translated text", "af_heart");
});

test("TtsAdapter should fallback to source text when translation target matches language", async () => {
  const kokoro = {
    generate: vi.fn().mockResolvedValue({ audio: new ArrayBuffer(2), audioLength: 1 }),
  } as any as Kokoro;

  const adapter = new TtsAdapter(kokoro);

  const scene: SceneInput = {
    text: "Hola mundo",
    searchTerms: ["hola", "mundo"],
    language: LanguageEnum.es,
    translationTarget: LanguageEnum.es,
  };

  const result = await adapter.synthesize(scene);

  expect(result.audioLength).toBe(1);
  expect(kokoro.generate).toHaveBeenCalledWith("Hola mundo", "af_sarah");
});
