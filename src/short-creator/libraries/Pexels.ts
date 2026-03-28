/* eslint-disable @remotion/deterministic-randomness */
import { getOrientationConfig } from "../../components/utils";
import { logger } from "../../logger";
import { OrientationEnum, type Video } from "../../types/shorts";

const jokerTerms: string[] = ["nature", "globe", "space", "ocean"];
const durationBufferSeconds = 3;
const defaultTimeoutMs = 5000;
const retryTimes = 3;
const genericTerms = new Set([
  "news",
  "latest",
  "update",
  "breaking",
  "story",
  "world",
  "sports",
  "business",
  "science",
  "technology",
  "controversy",
]);

const domainAnchors: Array<{ pattern: RegExp; queries: string[] }> = [
  { pattern: /(cricket|ipl|pcb|icc|wicket|bowler|batsman)/i, queries: ["cricket stadium", "cricket player", "cricket crowd"] },
  { pattern: /(nba|basketball|playoff|hoops)/i, queries: ["basketball court", "basketball player", "arena crowd"] },
  { pattern: /(football|soccer|goal|premier league)/i, queries: ["football stadium", "soccer player", "stadium crowd"] },
  { pattern: /(market|stocks|earnings|economy|trade|business|investor|tariff)/i, queries: ["stock market", "trading floor", "business district"] },
  { pattern: /(election|parliament|president|prime minister|summit|diplomacy|war|conflict|government)/i, queries: ["press conference", "parliament building", "world leaders"] },
  { pattern: /(science|laboratory|research|scientist|space|rocket|nasa|climate)/i, queries: ["science laboratory", "space launch", "scientist research"] },
  { pattern: /(ai|technology|tech|startup|software|robot|chip|semiconductor)/i, queries: ["technology lab", "computer server", "circuit board"] },
];

type PexelsResult = {
  id: string;
  duration: number;
  video_files: {
    fps: number;
    quality: string;
    width: number;
    height: number;
    id: string;
    link: string;
  }[];
};

export class PexelsAPI {
  constructor(private API_KEY: string) {}

  private normalizeTerm(term: string): string {
    return term
      .replace(/[^\w\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private buildDomainQueryVariants(searchTerms: string[]): string[] {
    const haystack = searchTerms.join(" ");
    return Array.from(new Set(
      domainAnchors
        .filter((entry) => entry.pattern.test(haystack))
        .flatMap((entry) => entry.queries),
    ));
  }

  private buildQueryCandidates(searchTerms: string[]): string[] {
    const normalized = Array.from(new Set(
      searchTerms
        .map((term) => this.normalizeTerm(term))
        .filter(Boolean),
    ));

    const specific = normalized
      .filter((term) => !genericTerms.has(term.toLowerCase()) || term.includes(" "))
      .sort((a, b) => {
        const aWords = a.split(/\s+/).length;
        const bWords = b.split(/\s+/).length;
        return (bWords * 100 + b.length) - (aWords * 100 + a.length);
      });

    const domainSpecific = this.buildDomainQueryVariants(specific);
    const phraseCombos: string[] = [];
    for (let i = 0; i < Math.min(3, specific.length); i++) {
      for (let j = i + 1; j < Math.min(4, specific.length); j++) {
        phraseCombos.push(`${specific[i]} ${specific[j]}`);
      }
    }

    return Array.from(new Set([
      ...specific,
      ...domainSpecific,
      ...phraseCombos,
      ...normalized.filter((term) => !specific.includes(term)),
    ])).slice(0, 10);
  }

  private selectBestVideo(
    videos: PexelsResult[],
    minDurationSeconds: number,
    excludeIds: string[],
    orientation: OrientationEnum,
  ): Video {
    const { width: requiredVideoWidth, height: requiredVideoHeight } =
      getOrientationConfig(orientation);

    const scoredVideos = videos
      .flatMap((video) => {
        if (excludeIds.includes(video.id) || !video.video_files.length) {
          return [];
        }

        const primaryFps = video.video_files[0]?.fps || 25;
        const normalizedDuration =
          primaryFps < 25 ? video.duration * (primaryFps / 25) : video.duration;

        if (normalizedDuration < minDurationSeconds + durationBufferSeconds) {
          return [];
        }

        return video.video_files
          .filter((file) => file.quality === "hd")
          .map((file) => {
            const dimensionPenalty =
              Math.abs(file.width - requiredVideoWidth) +
              Math.abs(file.height - requiredVideoHeight);
            const durationPenalty = Math.abs(normalizedDuration - (minDurationSeconds + durationBufferSeconds));
            const fpsPenalty = Math.abs((file.fps || 25) - 30) * 15;
            const score = dimensionPenalty + (durationPenalty * 10) + fpsPenalty;
            return {
              score,
              candidate: {
                id: video.id,
                url: file.link,
                width: file.width,
                height: file.height,
              } satisfies Video,
            };
          });
      })
      .sort((a, b) => a.score - b.score);

    const bestMatch = scoredVideos[0]?.candidate;
    if (!bestMatch) {
      logger.error("No videos found in Pexels API");
      throw new Error("No videos found");
    }

    return bestMatch;
  }

  private async _findVideo(
    searchTerm: string,
    minDurationSeconds: number,
    excludeIds: string[],
    orientation: OrientationEnum,
    timeout: number,
  ): Promise<Video> {
    if (!this.API_KEY) {
      throw new Error("API key not set");
    }

    logger.debug(
      { searchTerm, minDurationSeconds, orientation },
      "Searching for video in Pexels API",
    );

    const headers = new Headers();
    headers.append("Authorization", this.API_KEY);
    const response = await fetch(
      `https://api.pexels.com/videos/search?orientation=${orientation}&size=medium&per_page=80&query=${encodeURIComponent(searchTerm)}`,
      {
        method: "GET",
        headers,
        redirect: "follow",
        signal: AbortSignal.timeout(timeout),
      },
    )
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error(
              "Invalid Pexels API key - please make sure you get a valid key from https://www.pexels.com/api and set it in the environment variable PEXELS_API_KEY",
            );
          }
          throw new Error(`Pexels API error: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .catch((error: unknown) => {
        logger.error(error, "Error fetching videos from Pexels API");
        throw error;
      });

    const videos = response.videos as PexelsResult[];
    if (!videos || videos.length === 0) {
      logger.error(
        { searchTerm, orientation },
        "No videos found in Pexels API",
      );
      throw new Error("No videos found");
    }

    const video = this.selectBestVideo(
      videos,
      minDurationSeconds,
      excludeIds,
      orientation,
    );

    logger.debug(
      { searchTerm, video, minDurationSeconds, orientation },
      "Found video from Pexels API",
    );

    return video;
  }

  async findVideo(
    searchTerms: string[],
    minDurationSeconds: number,
    excludeIds: string[] = [],
    orientation: OrientationEnum = OrientationEnum.portrait,
    timeout: number = defaultTimeoutMs,
    retryCounter: number = 0,
  ): Promise<Video> {
    const shuffledJokerTerms = [...jokerTerms].sort(() => Math.random() - 0.5);
    const prioritizedSearchTerms = this.buildQueryCandidates(searchTerms);

    for (const searchTerm of [...prioritizedSearchTerms, ...shuffledJokerTerms]) {
      try {
        return await this._findVideo(
          searchTerm,
          minDurationSeconds,
          excludeIds,
          orientation,
          timeout,
        );
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error instanceof DOMException &&
          error.name === "TimeoutError"
        ) {
          if (retryCounter < retryTimes) {
            logger.warn(
              { searchTerm, retryCounter },
              "Timeout error, retrying...",
            );
            return await this.findVideo(
              searchTerms,
              minDurationSeconds,
              excludeIds,
              orientation,
              timeout,
              retryCounter + 1,
            );
          }
          logger.error(
            { searchTerm, retryCounter },
            "Timeout error, retry limit reached",
          );
          throw error;
        }

        logger.error(error, "Error finding video in Pexels API for term");
      }
    }

    logger.error(
      { searchTerms },
      "No videos found in Pexels API for the given terms",
    );
    throw new Error("No videos found in Pexels API");
  }
}
