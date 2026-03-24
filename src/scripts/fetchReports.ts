import cron from "node-cron";
import { Config, logger } from "../config";
import { NEWS_SOURCES, RssFetcher } from "../news-fetcher/RssFetcher";
import { ReportStore } from "../db/ReportStore";

export async function fetchReports(sourceId?: string): Promise<number> {
  const config = new Config();
  const reportStore = new ReportStore(config.dataDirPath);
  const chosenSourceId = sourceId || NEWS_SOURCES[0]?.id;
  if (!chosenSourceId) {
    throw new Error("No sourceId provided and no default source configured");
  }

  const source = NEWS_SOURCES.find((item) => item.id === chosenSourceId);
  if (!source) {
    throw new Error(`Source ${chosenSourceId} not found`);
  }

  const rssFetcher = new RssFetcher();
  const stories = await rssFetcher.fetchStories(chosenSourceId);

  let inserted = 0;
  for (const story of stories) {
    await reportStore.add({
      sourceId: source.id,
      sourceName: source.name,
      category: source.category || "General",
      title: story.title,
      content: story.content,
      link: story.link,
      pubDate: story.pubDate,
    });
    inserted += 1;
  }

  return inserted;
}

if (require.main === module) {
  const config = new Config();
  const cronExpression = process.env.CRON_INTERVAL || "*/30 * * * *";

  logger.info({ cronExpression }, "Starting report fetcher cron");

  cron.schedule(cronExpression, async () => {
    try {
      const count = await fetchReports();
      logger.info({ count }, "Fetched and stored news reports");
    } catch (error: unknown) {
      logger.error({ err: error }, "Report fetcher cron failed");
    }
  });

  // run immediately once
  fetchReports().catch((err) => {
    logger.error({ err }, "Initial report fetch failed");
  });
}
