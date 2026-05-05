import { logger } from "../logger";

export interface MockWebsiteData {
  url: string;
  title: string;
  tagline?: string;
  primaryColor?: string;
  logoText?: string;
  category?: string;
}

export interface BannerVariant {
  id: string;
  type: "hero" | "sidebar" | "square" | "leaderboard";
  headline: string;
  subtext: string;
  ctaText: string;
  svgMarkup: string;
  width: number;
  height: number;
  colorScheme: string;
}

export interface CampaignPlan {
  title: string;
  targetAudience: string;
  platforms: string[];
  messaging: string[];
  hooks: string[];
  contentTypes: string[];
  postingSchedule: string;
  expectedReach: string;
}

const COLOR_SCHEMES = [
  { name: "indigo-gold", primary: "#6366f1", secondary: "#f59e0b", text: "#ffffff" },
  { name: "teal-orange", primary: "#0d9488", secondary: "#f97316", text: "#ffffff" },
  { name: "rose-purple", primary: "#f43f5e", secondary: "#8b5cf6", text: "#ffffff" },
  { name: "slate-cyan", primary: "#1e293b", secondary: "#06b6d4", text: "#ffffff" },
  { name: "emerald-amber", primary: "#059669", secondary: "#d97706", text: "#ffffff" },
];

const NICHE_AUDIENCES: Record<string, string> = {
  tech: "Tech enthusiasts, developers, early adopters aged 18-45",
  finance: "Young professionals, investors, budget-conscious adults 25-45",
  health: "Health-conscious individuals, wellness seekers aged 20-50",
  food: "Food lovers, home cooks, culinary adventurers aged 18-45",
  fitness: "Fitness enthusiasts, gym-goers, athletes aged 18-40",
  general: "Broad digital audience aged 18-45",
};

function svgBanner(w: number, h: number, headline: string, subtext: string, ctaText: string, c: typeof COLOR_SCHEMES[0]): string {
  const safe = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const titleSize = Math.min(h * 0.22, 48);
  const subSize = Math.min(h * 0.14, 28);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c.primary}"/><stop offset="100%" stop-color="${c.secondary}"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#g)" rx="12"/>
  <text x="${w / 2}" y="${h * 0.35}" text-anchor="middle" fill="${c.text}" font-size="${titleSize}" font-family="Inter,Arial" font-weight="800">${safe(headline)}</text>
  <text x="${w / 2}" y="${h * 0.58}" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-size="${subSize}" font-family="Inter,Arial">${safe(subtext)}</text>
  <rect x="${w / 2 - 120}" y="${h * 0.72}" width="240" height="${Math.min(h * 0.2, 52)}" rx="26" fill="white"/>
  <text x="${w / 2}" y="${h * 0.72 + Math.min(h * 0.13, 34)}" text-anchor="middle" fill="${c.primary}" font-size="${subSize * 0.9}" font-family="Inter,Arial" font-weight="700">${safe(ctaText)}</text>
</svg>`;
}

export class MarketingEngine {
  generateBanners(websiteData: MockWebsiteData): BannerVariant[] {
    try {
      const category = (websiteData.category || "general").toLowerCase();
      const audience = NICHE_AUDIENCES[category] || NICHE_AUDIENCES.general;
      const headline = websiteData.tagline || websiteData.title || "Grow Your Audience";
      const subtext = `Trusted by creators in ${category}`;
      const ctaText = "Get Started Free";

      const sizes: Array<{ type: BannerVariant["type"]; w: number; h: number }> = [
        { type: "hero", w: 1200, h: 400 },
        { type: "sidebar", w: 300, h: 600 },
        { type: "square", w: 600, h: 600 },
        { type: "leaderboard", w: 728, h: 90 },
      ];

      const variants: BannerVariant[] = sizes.map((size, i) => {
        const scheme = COLOR_SCHEMES[i % COLOR_SCHEMES.length];
        return {
          id: `banner_${size.type}_${Date.now()}`,
          type: size.type,
          headline,
          subtext: size.h < 120 ? "" : subtext,
          ctaText,
          svgMarkup: svgBanner(size.w, size.h, headline, size.h > 120 ? subtext : "", size.h > 120 ? ctaText : "", scheme),
          width: size.w,
          height: size.h,
          colorScheme: scheme.name,
        };
      });

      logger.debug({ url: websiteData.url, count: variants.length }, "MarketingEngine: banners generated");
      return variants;
    } catch (err) {
      logger.error({ err }, "MarketingEngine.generateBanners error");
      return [];
    }
  }

  generateCampaignPlan(niche: string, platform: string, goal: string): CampaignPlan {
    const nicheL = niche.toLowerCase();
    const audience = NICHE_AUDIENCES[nicheL] || NICHE_AUDIENCES.general;
    return {
      title: `${niche} ${goal} Campaign on ${platform}`,
      targetAudience: audience,
      platforms: [platform, platform === "tiktok" ? "instagram" : "tiktok"],
      messaging: [
        `Show real results with ${niche} content`,
        `Educational + entertaining mix for ${niche} audience`,
        `Behind-the-scenes authenticity builds trust`,
      ],
      hooks: [
        `"This ${niche} trick changed everything"`,
        `"Nobody talks about ${niche} this way"`,
        `"3 ${niche} secrets the experts don't share"`,
      ],
      contentTypes: ["short-form video", "carousel post", "story poll", "quote card"],
      postingSchedule: platform === "tiktok" ? "3x/day — 7am, 12pm, 7pm" : "2x/day — 9am, 6pm",
      expectedReach: "10K-50K organic reach in first 30 days with consistent posting",
    };
  }

  scrapeWebsiteMock(url: string): MockWebsiteData {
    const domain = url.replace(/https?:\/\//, "").split("/")[0];
    const name = domain.split(".")[0];
    const capitalName = name.charAt(0).toUpperCase() + name.slice(1);
    const categories = ["tech", "finance", "health", "food", "fitness", "general"];
    const category = categories[Math.floor(Math.random() * categories.length)];
    return {
      url, title: `${capitalName} — ${category} platform`,
      tagline: `The smartest way to grow in ${category}`,
      primaryColor: COLOR_SCHEMES[0].primary,
      logoText: capitalName,
      category,
    };
  }
}
