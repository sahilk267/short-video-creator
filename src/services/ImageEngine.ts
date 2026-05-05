import { logger } from "../logger";

export type ImageTemplate = "quote_card" | "carousel_slide" | "poster" | "banner" | "thumbnail_text" | "stats_card";

export interface QuoteCardOptions {
  quote: string;
  author?: string;
  background?: string;
  textColor?: string;
  fontSize?: number;
  width?: number;
  height?: number;
}

export interface CarouselSlide {
  slideNumber: number;
  title: string;
  body: string;
  footer?: string;
  background?: string;
  accent?: string;
}

export interface CarouselOptions {
  topic: string;
  slides: CarouselSlide[];
  style?: "clean" | "bold" | "minimal" | "colorful";
  brand?: string;
}

export interface PosterOptions {
  headline: string;
  subtext?: string;
  ctaText?: string;
  theme?: "dark" | "light" | "gradient";
  category?: string;
}

export interface BannerOptions {
  title: string;
  tagline?: string;
  width: number;
  height: number;
  platform: string;
}

export interface ImageRenderResult {
  template: ImageTemplate;
  svgMarkup?: string;
  width: number;
  height: number;
  description: string;
  slides?: CarouselSlide[];
  success: boolean;
}

const GRADIENT_PRESETS: Record<string, [string, string]> = {
  purple: ["#6366f1", "#8b5cf6"],
  orange: ["#f59e0b", "#ef4444"],
  blue: ["#3b82f6", "#06b6d4"],
  green: ["#10b981", "#34d399"],
  dark: ["#1e293b", "#0f172a"],
  pink: ["#ec4899", "#f43f5e"],
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  Tech: "purple", Finance: "blue", Health: "green", Food: "orange",
  Fitness: "orange", Travel: "blue", General: "dark", Motivation: "pink",
};

function svgEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxCharsPerLine) { lines.push(line.trim()); line = w; }
    else line = (line + " " + w).trim();
  }
  if (line) lines.push(line.trim());
  return lines;
}

export class ImageEngine {
  generateQuoteCard(opts: QuoteCardOptions): ImageRenderResult {
    try {
      const w = opts.width || 1080;
      const h = opts.height || 1080;
      const bg = opts.background || "#1e293b";
      const tc = opts.textColor || "#ffffff";
      const fs = opts.fontSize || 48;
      const lines = wrapText(opts.quote, Math.floor(w / (fs * 0.55)));
      const lineHeight = fs * 1.4;
      const totalTextHeight = lines.length * lineHeight;
      const startY = (h - totalTextHeight) / 2;

      const textElems = lines.map((line, i) =>
        `<text x="${w / 2}" y="${startY + i * lineHeight + fs}" text-anchor="middle" fill="${tc}" font-size="${fs}" font-family="Inter, Arial" font-weight="600">${svgEscape(line)}</text>`
      ).join("\n");

      const authorElem = opts.author
        ? `<text x="${w / 2}" y="${startY + totalTextHeight + 40}" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-size="${fs * 0.5}" font-family="Inter, Arial">— ${svgEscape(opts.author)}</text>`
        : "";

      const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  <rect x="80" y="${startY - 30}" width="${w - 160}" height="${totalTextHeight + 80}" rx="20" fill="rgba(255,255,255,0.05)"/>
  ${textElems}
  ${authorElem}
</svg>`;

      logger.debug({ w, h }, "ImageEngine: quote card generated");
      return { template: "quote_card", svgMarkup, width: w, height: h, description: `Quote card: "${opts.quote.substring(0, 50)}..."`, success: true };
    } catch (err) {
      logger.error({ err }, "ImageEngine.generateQuoteCard error");
      return { template: "quote_card", width: 1080, height: 1080, description: "Error", success: false };
    }
  }

  generateCarousel(opts: CarouselOptions): ImageRenderResult {
    try {
      const style = opts.style || "clean";
      const colors = style === "bold" ? ["#6366f1", "#f59e0b"] : style === "colorful" ? ["#ec4899", "#3b82f6"] : ["#1e293b", "#6366f1"];
      const slides = opts.slides.map((slide) => ({ ...slide, background: slide.background || colors[0], accent: slide.accent || colors[1] }));

      const firstSlide = slides[0];
      const w = 1080, h = 1080;
      const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${firstSlide.background}"/>
  <rect x="0" y="0" width="8" height="${h}" fill="${firstSlide.accent}"/>
  <text x="60" y="80" fill="rgba(255,255,255,0.5)" font-size="28" font-family="Inter,Arial">${svgEscape(opts.brand || opts.topic)} · ${slide(firstSlide.slideNumber, opts.slides.length)}</text>
  <text x="60" y="200" fill="white" font-size="64" font-family="Inter,Arial" font-weight="800">${svgEscape(firstSlide.title)}</text>
  <text x="60" y="360" fill="rgba(255,255,255,0.8)" font-size="36" font-family="Inter,Arial" font-weight="400">${svgEscape(firstSlide.body.substring(0, 120))}</text>
  ${firstSlide.footer ? `<text x="60" y="${h - 60}" fill="rgba(255,255,255,0.5)" font-size="28" font-family="Inter,Arial">${svgEscape(firstSlide.footer)}</text>` : ""}
</svg>`;

      logger.debug({ slides: slides.length }, "ImageEngine: carousel generated");
      return { template: "carousel_slide", svgMarkup, width: w, height: h, description: `Carousel: ${opts.topic} (${slides.length} slides)`, slides, success: true };
    } catch (err) {
      logger.error({ err }, "ImageEngine.generateCarousel error");
      return { template: "carousel_slide", width: 1080, height: 1080, description: "Error", success: false };
    }
  }

  generatePoster(opts: PosterOptions): ImageRenderResult {
    try {
      const w = 1080, h = 1920;
      const preset = CATEGORY_GRADIENTS[opts.category || "General"] || "dark";
      const [c1, c2] = GRADIENT_PRESETS[preset] || GRADIENT_PRESETS.dark;
      const headlineLines = wrapText(opts.headline, 22);
      const headlineElems = headlineLines.map((line, i) =>
        `<text x="540" y="${560 + i * 100}" text-anchor="middle" fill="white" font-size="80" font-family="Inter,Arial" font-weight="900">${svgEscape(line)}</text>`
      ).join("\n");

      const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  ${headlineElems}
  ${opts.subtext ? `<text x="540" y="${560 + headlineLines.length * 100 + 80}" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="48" font-family="Inter,Arial">${svgEscape(opts.subtext)}</text>` : ""}
  ${opts.ctaText ? `<rect x="190" y="${h - 280}" width="700" height="120" rx="60" fill="white"/><text x="540" y="${h - 200}" text-anchor="middle" fill="${c1}" font-size="52" font-family="Inter,Arial" font-weight="700">${svgEscape(opts.ctaText)}</text>` : ""}
</svg>`;

      logger.debug({ category: opts.category }, "ImageEngine: poster generated");
      return { template: "poster", svgMarkup, width: w, height: h, description: `Poster: ${opts.headline.substring(0, 50)}`, success: true };
    } catch (err) {
      logger.error({ err }, "ImageEngine.generatePoster error");
      return { template: "poster", width: 1080, height: 1920, description: "Error", success: false };
    }
  }

  generateBanner(opts: BannerOptions): ImageRenderResult {
    try {
      const { width: w, height: h, platform } = opts;
      const preset = GRADIENT_PRESETS.purple;
      const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="b" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${preset[0]}"/><stop offset="100%" stop-color="${preset[1]}"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#b)"/>
  <text x="${w / 2}" y="${h / 2 - 10}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="${Math.min(h * 0.4, 72)}" font-family="Inter,Arial" font-weight="800">${svgEscape(opts.title)}</text>
  ${opts.tagline ? `<text x="${w / 2}" y="${h / 2 + 40}" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="${Math.min(h * 0.22, 36)}" font-family="Inter,Arial">${svgEscape(opts.tagline)}</text>` : ""}
  <text x="${w - 20}" y="${h - 12}" text-anchor="end" fill="rgba(255,255,255,0.4)" font-size="18" font-family="Inter,Arial">${svgEscape(platform)}</text>
</svg>`;

      logger.debug({ platform, w, h }, "ImageEngine: banner generated");
      return { template: "banner", svgMarkup, width: w, height: h, description: `Banner: ${opts.title} (${platform})`, success: true };
    } catch (err) {
      logger.error({ err }, "ImageEngine.generateBanner error");
      return { template: "banner", width: opts.width, height: opts.height, description: "Error", success: false };
    }
  }
}

function slide(n: number, total: number): string { return `${n}/${total}`; }
