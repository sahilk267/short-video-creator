export class SeoOptimizerService {
  optimize(params: { title: string; description: string; keywords: string[]; category?: string }) {
    const category = params.category ? `${params.category} ` : "";
    const keywordTail = params.keywords.slice(0, 5).join(" ");
    const title = `${category}${params.title}`.slice(0, 100);
    const hashtags = params.keywords.slice(0, 8).map((k) => `#${k.replace(/[^a-zA-Z0-9]/g, "")}`);
    const keywordDensityScore = Math.min(100, params.keywords.length * 10);

    return {
      title,
      description: params.description,
      hashtags,
      keywordDensityScore,
    };
  }
}
