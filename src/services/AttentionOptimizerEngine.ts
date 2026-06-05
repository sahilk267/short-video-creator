/* eslint-disable @remotion/deterministic-randomness */

export interface AttentionSpan {
  secondsToFirstCurve: number;
  retentionRate: number;
  dropOffPoints: number[];
  recommendedCutPoints: number[];
}

export interface AttentionOptimization {
  hookLength: number;
  paceMultiplier: number;
  transitionFrequency: number;
  musicIntensity: number;
  visualChangeFrequency: number;
  estimatedRetention: number;
}

export class AttentionOptimizerEngine {
  private audienceProfile = {
    tiktok: { avgWatchTime: 15, dropOffAt: [3, 7, 12] },
    instagram: { avgWatchTime: 30, dropOffAt: [5, 15, 25] },
    youtube: { avgWatchTime: 180, dropOffAt: [10, 30, 60, 120] },
    youtube_shorts: { avgWatchTime: 15, dropOffAt: [3, 8, 12] },
  };

  analyzeAttentionSpan(videoDuration: number, platform: "tiktok" | "instagram" | "youtube" | "youtube_shorts"): AttentionSpan {
    const profile = this.audienceProfile[platform];
    const secondsToFirstCurve = Math.max(2, Math.min(5, videoDuration * 0.15));

    const dropOffPoints = profile.dropOffAt.filter((d) => d < videoDuration);
    const recommendedCutPoints = dropOffPoints.map((d) => Math.max(2, d - 1));

    return {
      secondsToFirstCurve,
      retentionRate: 0.7 - dropOffPoints.length * 0.1,
      dropOffPoints,
      recommendedCutPoints,
    };
  }

  optimizeForAttention(
    videoDuration: number,
    platform: "tiktok" | "instagram" | "youtube" | "youtube_shorts" = "tiktok",
  ): AttentionOptimization {
    const span = this.analyzeAttentionSpan(videoDuration, platform);

    const baseHookLength = span.secondsToFirstCurve;
    const paceMultiplier = 1.1 + (span.dropOffPoints.length * 0.05);
    const transitionFrequency = 3 + span.dropOffPoints.length;
    const musicIntensity = 0.7 + span.retentionRate * 0.3;
    const visualChangeFrequency = 2 + span.dropOffPoints.length * 0.5;

    return {
      hookLength: baseHookLength,
      paceMultiplier,
      transitionFrequency,
      musicIntensity,
      visualChangeFrequency,
      estimatedRetention: span.retentionRate,
    };
  }

  generateHookScript(platform: string, topic: string): string {
    const hooks: Record<string, string[]> = {
      tiktok: [
        "Wait till the end...",
        "This changed everything...",
        "You won't believe what happens next...",
        "This is wild...",
      ],
      instagram: [
        "Swipe for the reveal...",
        "Trust me on this...",
        "You need to see this...",
        "This goes hard...",
      ],
      youtube: [
        "In this video I show you...",
        "You've never seen this before...",
        "This will blow your mind...",
        "Stick around to see...",
      ],
    };

    const hookList = hooks[platform] || hooks.tiktok;
    const selected = hookList[Math.floor(Math.random() * hookList.length)];
    return `${selected} ${topic}`;
  }
}
