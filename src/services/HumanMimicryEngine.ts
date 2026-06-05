export interface HumanizedSchedule {
  originalTime: Date;
  humanizedTime: Date;
  delayMinutes: number;
  skipPost: boolean;
  reason: string;
  hashtags: string[];
}

export class HumanMimicryEngine {
  private readonly MIN_DELAY_MIN = -30;
  private readonly MAX_DELAY_MIN = 45;
  private readonly SKIP_DAY_PROBABILITY = 0.05;

  private deterministicRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  humanizeSchedule(originalTime: Date, hashtags: string[]): HumanizedSchedule {
    const skipPost = this.deterministicRandom(originalTime.getTime()) < this.SKIP_DAY_PROBABILITY;
    if (skipPost) {
      return {
        originalTime, humanizedTime: originalTime, delayMinutes: 0,
        skipPost: true, reason: "Natural random skip day (5% probability)", hashtags,
      };
    }

    const delayMinutes = Math.floor(this.deterministicRandom(originalTime.getTime() + 1) * (this.MAX_DELAY_MIN - this.MIN_DELAY_MIN + 1)) + this.MIN_DELAY_MIN;
    const humanizedTime = new Date(originalTime.getTime() + delayMinutes * 60 * 1000);
    const shuffledHashtags = this.shuffleHashtags(hashtags);

    return {
      originalTime, humanizedTime, delayMinutes, skipPost: false,
      reason: `Natural delay: ${delayMinutes > 0 ? "+" : ""}${delayMinutes} minutes`,
      hashtags: shuffledHashtags,
    };
  }

  shuffleHashtags(hashtags: string[]): string[] {
    const arr = [...hashtags];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.deterministicRandom(i) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  addTypingVariation(text: string): string {
    const variations = [
      (t: string) => t,
      (t: string) => t.replace(/\./g, ".."),
      (t: string) => t.replace(/!$/g, " !"),
    ];
    const variation = variations[Math.floor(this.deterministicRandom(text.length) * variations.length)];
    return variation(text);
  }

  isWithinActiveHours(timezone = "UTC"): boolean {
    void timezone;
    const now = new Date();
    const hour = now.getUTCHours();
    return hour >= 8 && hour <= 22;
  }

  getHumanizedDelay(baseDelayMs: number): number {
    const jitter = (this.deterministicRandom(baseDelayMs) - 0.5) * 0.2;
    return Math.max(0, baseDelayMs + baseDelayMs * jitter);
  }

  shouldTakeBreak(): boolean {
    const now = new Date();
    const hour = now.getUTCHours();
    return hour >= 1 && hour <= 6;
  }

  simulateEngagementDelay(): number {
    const delays = [2000, 5000, 10000, 15000, 30000, 60000];
    return delays[Math.floor(this.deterministicRandom(delays.length) * delays.length)];
  }
}
