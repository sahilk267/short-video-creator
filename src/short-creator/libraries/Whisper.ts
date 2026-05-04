import {
  downloadWhisperModel,
  installWhisperCpp,
  transcribe,
} from "@remotion/install-whisper-cpp";
import path from "path";
import fs from "fs-extra";

import { Config } from "../../config";
import { type Caption, LanguageEnum } from "../../types/shorts";
import { logger } from "../../logger";

export const ErrorWhisper = new Error("There was an error with WhisperCpp");

export class Whisper {
  constructor(private config: Config) {}

  private static getWhisperBinPath(installPath: string, version: string): string {
    // Mirror @remotion/install-whisper-cpp getWhisperExecutablePath logic
    const semver = version.split(".").map(Number);
    const is174plus =
      semver[0] > 1 ||
      (semver[0] === 1 && semver[1] > 7) ||
      (semver[0] === 1 && semver[1] === 7 && (semver[2] ?? 0) >= 4);
    if (is174plus) {
      return path.join(installPath, "build", "bin", "whisper-cli");
    }
    return path.join(installPath, "main");
  }

  private static async ensureInstalled(config: Config): Promise<void> {
    const modelFolder = path.join(config.whisperInstallPath, "models");
    const whisperBinPath = Whisper.getWhisperBinPath(config.whisperInstallPath, config.whisperVersion);
    const hasWhisperBinary = fs.existsSync(whisperBinPath);
    const hasModelFolder =
      fs.existsSync(modelFolder) && fs.readdirSync(modelFolder).length > 0;

    if (!hasWhisperBinary) {
      logger.debug("Installing WhisperCpp");
      // Remove partial/corrupt install (e.g. cloned source without compiled binary)
      if (fs.existsSync(config.whisperInstallPath)) {
        logger.debug("Removing existing partial whisper install");
        fs.removeSync(config.whisperInstallPath);
      }
      await installWhisperCpp({
        to: config.whisperInstallPath,
        version: config.whisperVersion,
        printOutput: true,
      });
      logger.debug("WhisperCpp installed");
    }

    if (!hasModelFolder) {
      logger.debug("Downloading Whisper model");
      await downloadWhisperModel({
        model: config.whisperModel,
        folder: modelFolder,
        printOutput: config.whisperVerbose,
        onProgress: (downloadedBytes, totalBytes) => {
          const progress = `${Math.round((downloadedBytes / totalBytes) * 100)}%`;
          logger.debug(
            { progress, model: config.whisperModel },
            "Downloading Whisper model",
          );
        },
      });
      // todo run the jfk command to check if everything is ok
      logger.debug("Whisper model downloaded");
    }
  }

  static async init(config: Config): Promise<Whisper> {
    await Whisper.ensureInstalled(config);

    return new Whisper(config);
  }

  // todo shall we extract it to a Caption class?
  async CreateCaption(audioPath: string, language: LanguageEnum = LanguageEnum.en): Promise<Caption[]> {
    logger.debug({ audioPath, language }, "Starting to transcribe audio");

    // Select model for language (fallback to configured model)
    const model = language === LanguageEnum.hi ? "medium" : this.config.whisperModel;

    const { transcription } = await transcribe({
      model,
      whisperPath: this.config.whisperInstallPath,
      modelFolder: path.join(this.config.whisperInstallPath, "models"),
      whisperCppVersion: this.config.whisperVersion,
      inputPath: audioPath,
      tokenLevelTimestamps: true,
      printOutput: this.config.whisperVerbose,
      onProgress: (progress) => {
        logger.debug({ audioPath }, `Transcribing is ${progress} complete`);
      },
    });
    logger.debug({ audioPath }, "Transcription finished, creating captions");

    const captions: Caption[] = [];
    transcription.forEach((record) => {
      if (record.text === "") {
        return;
      }

      record.tokens.forEach((token) => {
        if (token.text.startsWith("[_TT")) {
          return;
        }
        // if token starts without space and the previous node didn't have space either, merge them
        if (
          captions.length > 0 &&
          !token.text.startsWith(" ") &&
          !captions[captions.length - 1].text.endsWith(" ")
        ) {
          captions[captions.length - 1].text += record.text;
          captions[captions.length - 1].endMs = record.offsets.to;
          return;
        }
        captions.push({
          text: token.text,
          startMs: record.offsets.from,
          endMs: record.offsets.to,
        });
      });
    });
    logger.debug({ audioPath, captions }, "Captions created");
    return captions;
  }
}
