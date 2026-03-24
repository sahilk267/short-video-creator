import { test, expect, vi } from "vitest";
import { Whisper } from "./Whisper";
import { Config } from "../../config";
import { LanguageEnum } from "../../types/shorts";

vi.mock("@remotion/install-whisper-cpp", () => {
  return {
    transcribe: vi.fn().mockResolvedValue({
      transcription: [
        {
          text: "Test",
          offsets: { from: 0, to: 1000 },
          tokens: [
            { text: "Test", timestamp: { from: 0, to: 1000 } },
          ],
        },
      ],
    }),
  };
});

import { transcribe } from "@remotion/install-whisper-cpp";

test("Whisper should use Hindi model mapping for hi language", async () => {
  const config = new Config();
  config.whisperModel = "medium.en";

  const whisper = await Whisper.init(config);

  const captions = await whisper.CreateCaption("/tmp/fake.wav", LanguageEnum.hi);

  expect(captions).toBeDefined();
  expect(captions.length).toBeGreaterThan(0);

  expect(transcribe).toHaveBeenCalledWith(expect.objectContaining({ model: "medium" }));
});
