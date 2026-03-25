export class ViralStrategyService {
  score(params: { views: number; likes: number; shares: number; comments: number }) {
    const engagement = params.likes + params.shares * 2 + params.comments * 1.5;
    const virality = params.views > 0 ? Math.min(100, Math.round((engagement / params.views) * 1000)) : 0;
    const cta = virality < 20
      ? "Use stronger CTA in first 3 seconds"
      : virality < 50
        ? "Try shorter title + trend hashtag"
        : "Scale this format to more channels";

    return { viralityScore: virality, recommendation: cta };
  }
}
