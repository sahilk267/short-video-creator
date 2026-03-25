/* eslint-disable @typescript-eslint/no-unused-vars */
import path from "path";
import fs from "fs-extra";

import { Kokoro } from "./short-creator/libraries/Kokoro";
import { Remotion } from "./short-creator/libraries/Remotion";
import { Whisper } from "./short-creator/libraries/Whisper";
import { FFMpeg } from "./short-creator/libraries/FFmpeg";
import { PexelsAPI } from "./short-creator/libraries/Pexels";
import { Config } from "./config";
import { ShortCreator } from "./short-creator/ShortCreator";
import { install } from "./scripts/install";
import { logger } from "./logger";
import { Server } from "./server/server";
import { MusicManager } from "./short-creator/music";
import { testRedisConnection } from "./workers/QueueManager";
import { RenderWorker } from "./workers/RenderWorker";
import { PublishWorker } from "./workers/PublishWorker";
import { DeadLetterWorker } from "./workers/DeadLetterWorker";
import { SchedulerService } from "./services/SchedulerService";

async function main() {
  const config = new Config();
  try {
    config.ensureConfig();
  } catch (err: unknown) {
    logger.error(err, "Error in config");
    process.exit(1);
  }

  logger.info("Initializing applications...");
  await install();

  const musicManager = new MusicManager(config);
  try {
    logger.debug("checking music files");
    musicManager.ensureMusicFilesExist();
  } catch (error: unknown) {
    logger.error(error, "Missing music files");
    process.exit(1);
  }

  logger.debug("initializing remotion");
  const remotion = await Remotion.init(config);
  logger.debug("initializing kokoro");
  const kokoro = await Kokoro.init(config.kokoroModelPrecision);
  logger.debug("initializing whisper");
  const whisper = await Whisper.init(config);
  logger.debug("initializing ffmpeg");
  const ffmpeg = await FFMpeg.init();
  const pexelsApi = new PexelsAPI(config.pexelsApiKey);

  logger.debug("initializing the short creator");
  const shortCreator = new ShortCreator(
    config,
    remotion,
    kokoro,
    whisper,
    ffmpeg,
    pexelsApi,
    musicManager,
  );

  if (!config.runningInDocker) {
    // the project is running with npm - we need to check if the installation is correct
    if (fs.existsSync(config.installationSuccessfulPath)) {
      logger.info("the installation is successful - starting the server");
    } else {
      logger.info(
        "testing if the installation was successful - this may take a while...",
      );
      try {
        const audioBuffer = (await kokoro.generate("hi", "af_heart")).audio;
        await ffmpeg.createMp3DataUri(audioBuffer);
        await pexelsApi.findVideo(["dog"], 2.4);
        const testVideoPath = path.join(config.tempDirPath, "test.mp4");
        await remotion.testRender(testVideoPath);
        fs.rmSync(testVideoPath, { force: true });
        fs.writeFileSync(config.installationSuccessfulPath, "ok", {
          encoding: "utf-8",
        });
        logger.info("the installation was successful - starting the server");
      } catch (error: unknown) {
        logger.fatal(
          error,
          "The environment is not set up correctly - please follow the instructions in the README.md file https://github.com/gyoridavid/short-video-maker",
        );
        process.exit(1);
      }
    }
  }

  logger.debug("initializing the server");

  const server = new Server(config, shortCreator);
  const app = server.start();

  // Phase 4: Start BullMQ workers if Redis is available
  let renderWorker: RenderWorker | undefined;
  let publishWorker: PublishWorker | undefined;
  let deadLetterWorker: DeadLetterWorker | undefined;

  if (config.redisEnabled) {
    const redisOk = await testRedisConnection(config);
    if (redisOk) {
      renderWorker = new RenderWorker(config, shortCreator);
      publishWorker = new PublishWorker(config);
      deadLetterWorker = new DeadLetterWorker(config);
      logger.info("BullMQ workers started (render, publish, deadletter)");
    } else {
      logger.warn("Redis unavailable – BullMQ workers NOT started. App runs in direct-queue mode.");
    }
  }

  // Phase 6: Start cron scheduler
  const scheduler = new SchedulerService(config, shortCreator);
  scheduler.start();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Graceful shutdown initiated");
    scheduler.stop();
    await Promise.allSettled([
      renderWorker?.close(),
      publishWorker?.close(),
      deadLetterWorker?.close(),
    ]);
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));
}

main().catch((error: unknown) => {
  logger.error(error, "Error starting server");
});
