import { logger } from "../logger";

export interface EnhancementSettings {
  autoSharpen: boolean;
  contrastOptimize: boolean;
  ruleOfThirds: boolean;
  safeZones: boolean;
  saturation: number;
  brightness: number;
  sharpnessLevel: number;
  noiseReduction: number;
}

export interface EnhancementResult {
  sharpenAmount: number;
  contrastMultiplier: number;
  colorCorrection: { hue: number; saturation: number; lightness: number };
  gridOverlay: { enabled: boolean; lines: Array<{ x: number; y: number }> };
  safeZoneMargins: { top: number; bottom: number; left: number; right: number };
  estimatedQualityScore: number;
}

export class VisualEnhancementEngine {
  enhanceVideo(
    videoWidth: number,
    videoHeight: number,
    settings: EnhancementSettings,
  ): EnhancementResult {
    const sharpenAmount = settings.autoSharpen ? 0.5 + settings.sharpnessLevel * 0.1 : 0;
    const contrastMultiplier = 1.1 + (settings.contrastOptimize ? 0.15 : 0);

    const gridLines: Array<{ x: number; y: number }> = [];
    if (settings.ruleOfThirds) {
      const thirdX = videoWidth / 3;
      const thirdY = videoHeight / 3;
      gridLines.push(
        { x: thirdX, y: 0 },
        { x: thirdX * 2, y: 0 },
        { x: 0, y: thirdY },
        { x: 0, y: thirdY * 2 },
      );
    }

    const safeZoneMargins = {
      top: settings.safeZones ? 40 : 0,
      bottom: settings.safeZones ? 40 : 0,
      left: settings.safeZones ? 60 : 0,
      right: settings.safeZones ? 60 : 0,
    };

    let qualityScore = 60;
    if (settings.autoSharpen) qualityScore += 15;
    if (settings.contrastOptimize) qualityScore += 15;
    if (settings.ruleOfThirds) qualityScore += 10;

    return {
      sharpenAmount,
      contrastMultiplier,
      colorCorrection: {
        hue: 0,
        saturation: settings.saturation,
        lightness: settings.brightness * 5,
      },
      gridOverlay: {
        enabled: settings.ruleOfThirds,
        lines: gridLines,
      },
      safeZoneMargins,
      estimatedQualityScore: qualityScore,
    };
  }

  generateFfmpegFilters(enhancement: EnhancementResult): string {
    const filters: string[] = [];

    if (enhancement.sharpenAmount > 0) {
      filters.push(`sharpen=amount=${enhancement.sharpenAmount}`);
    }

    filters.push(`contrast=${enhancement.contrastMultiplier}`);

    if (enhancement.colorCorrection.saturation !== 0) {
      filters.push(`saturation=${1 + enhancement.colorCorrection.saturation / 100}`);
    }

    if (enhancement.colorCorrection.lightness !== 0) {
      filters.push(`brightness=${1 + enhancement.colorCorrection.lightness / 100}`);
    }

    return filters.join(",");
  }

  validateFraming(width: number, height: number, margins: { top: number; bottom: number; left: number; right: number }): boolean {
    const safeWidth = width - margins.left - margins.right;
    const safeHeight = height - margins.top - margins.bottom;
    return safeWidth > 0 && safeHeight > 0;
  }
}
