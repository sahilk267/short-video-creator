import path from "path";
import "dotenv/config";
import os from "os";
import fs from "fs-extra";
import pino from "pino";
import { kokoroModelPrecision, whisperModels } from "./types/shorts";

const defaultLogLevel: pino.Level = "info";
const defaultPort = 3123;
const whisperVersion = "1.7.1";
const defaultWhisperModel: whisperModels = "medium.en"; // possible options: "tiny", "tiny.en", "base", "base.en", "small", "small.en", "medium", "medium.en", "large-v1", "large-v2", "large-v3", "large-v3-turbo"

// Create the global logger
const versionNumber = process.env.npm_package_version;
const dataDirPath = process.env.DATA_DIR_PATH || path.join(os.homedir(), ".ai-agents-az-video-generator");
const logsDirPath = path.join(dataDirPath, "logs");

// Ensure logs directory exists
fs.ensureDirSync(logsDirPath);

const isRunningInDocker = process.env.DOCKER === "true";

// Simple logger for Docker to avoid pino worker thread issues
export const logger = isRunningInDocker 
  ? pino({
      level: process.env.LOG_LEVEL || defaultLogLevel,
      timestamp: pino.stdTimeFunctions.isoTime,
    })
  : pino({
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label: string) => {
          return { level: label };
        },
      },
      base: {
        pid: process.pid,
        version: versionNumber,
      },
    }, pino.transport({
      targets: [
        {
          target: 'pino/file',
          level: process.env.LOG_LEVEL || defaultLogLevel,
          options: { destination: 1 } // stdout
        },
        {
          target: 'pino/file',
          level: process.env.LOG_LEVEL || defaultLogLevel,
          options: { 
            destination: path.join(logsDirPath, "app.log"),
            mkdir: true 
          }
        }
      ]
    }));

export class Config {
  public dataDirPath: string;
  private libsDirPath: string;
  private staticDirPath: string;

  public installationSuccessfulPath: string;
  public whisperInstallPath: string;
  public videosDirPath: string;
  public tempDirPath: string;
  public logsDirPath: string;
  public packageDirPath: string;
  public musicDirPath: string;
  public pexelsApiKey: string;
  public pollinationsApiKey: string;
  public logLevel: pino.Level;
  public whisperVerbose: boolean;
  public port: number;
  public runningInDocker: boolean;
  public devMode: boolean;
  public whisperVersion: string = whisperVersion;
  public whisperModel: whisperModels = defaultWhisperModel;
  public kokoroModelPrecision: kokoroModelPrecision = "fp32";

  // docker-specific, performance-related settings to prevent memory issues
  public concurrency?: number;
  public videoCacheSizeInBytes: number | null = null;
  public useAiImages: boolean = false;
  public aiLlmUrl: string = "http://localhost:12434";
  public aiLlmModel: string = "docker.io/ai/llama3.2:latest";

  constructor() {
    this.dataDirPath =
      process.env.DATA_DIR_PATH ||
      path.join(os.homedir(), ".ai-agents-az-video-generator");
    this.libsDirPath = path.join(this.dataDirPath, "libs");

    this.whisperInstallPath = process.env.WHISPER_INSTALL_PATH || path.join(this.dataDirPath, "libs", "whisper");
    this.videosDirPath = path.join(this.dataDirPath, "videos");
    this.tempDirPath = path.join(this.dataDirPath, "temp");
    this.logsDirPath = path.join(this.dataDirPath, "logs");
    this.installationSuccessfulPath = path.join(
      this.dataDirPath,
      "installation-successful",
    );

    fs.ensureDirSync(this.dataDirPath);
    fs.ensureDirSync(this.libsDirPath);
    fs.ensureDirSync(this.videosDirPath);
    fs.ensureDirSync(this.tempDirPath);
    fs.ensureDirSync(this.logsDirPath);

    this.packageDirPath = path.join(__dirname, "..");
    this.staticDirPath = path.join(this.packageDirPath, "static");
    this.musicDirPath = path.join(this.staticDirPath, "music");

    this.pexelsApiKey = process.env.PEXELS_API_KEY as string;
    this.pollinationsApiKey = process.env.POLLINATIONS_API_KEY as string || "";
    this.logLevel = (process.env.LOG_LEVEL || defaultLogLevel) as pino.Level;
    this.whisperVerbose = process.env.WHISPER_VERBOSE === "true";
    this.port = process.env.PORT ? parseInt(process.env.PORT) : defaultPort;
    this.runningInDocker = process.env.DOCKER === "true";
    this.devMode = process.env.DEV === "true";

    if (process.env.WHISPER_MODEL) {
      this.whisperModel = process.env.WHISPER_MODEL as whisperModels;
    }
    if (process.env.KOKORO_MODEL_PRECISION) {
      this.kokoroModelPrecision = process.env
        .KOKORO_MODEL_PRECISION as kokoroModelPrecision;
    }

    this.concurrency = process.env.CONCURRENCY
      ? parseInt(process.env.CONCURRENCY)
      : undefined;

    if (process.env.VIDEO_CACHE_SIZE_IN_BYTES) {
      this.videoCacheSizeInBytes = parseInt(
        process.env.VIDEO_CACHE_SIZE_IN_BYTES,
      );
    }

    this.useAiImages = process.env.USE_AI_IMAGES === "true";
    this.aiLlmUrl = process.env.AI_LLM_URL || "http://localhost:12434";
    this.aiLlmModel = process.env.AI_LLM_MODEL || "docker.io/ai/llama3.2:latest";

    // Redirect caches to the persistent volume
    if (this.runningInDocker) {
      process.env.PUPPETEER_CACHE_DIR = path.join(this.dataDirPath, "cache", "puppeteer");
      process.env.HF_HOME = path.join(this.dataDirPath, "cache", "huggingface");
      logger.info({ 
        puppeteerCache: process.env.PUPPETEER_CACHE_DIR,
        hfHome: process.env.HF_HOME 
      }, "Caches redirected to persistent volume");
    }

    logger.info({
      port: this.port,
      dataDir: this.dataDirPath,
      aiLlmUrl: this.aiLlmUrl,
      aiLlmModel: this.aiLlmModel,
      runningInDocker: this.runningInDocker,
      devMode: this.devMode
    }, "Configuration loaded");
  }

  public ensureConfig() {
    if (!this.pexelsApiKey) {
      throw new Error(
        "PEXELS_API_KEY environment variable is missing. Get your free API key: https://www.pexels.com/api/key/ - see how to run the project: https://github.com/gyoridavid/short-video-maker",
      );
    }
  }
}

export const KOKORO_MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";
