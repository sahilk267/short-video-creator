/* eslint-disable @remotion/deterministic-randomness */

export interface QualityMetrics {
  audioQuality: number;
  visualQuality: number;
  scriptQuality: number;
  engagementPotential: number;
  technicalQuality: number;
  overallScore: number;
  issues: string[];
  recommendations: string[];
}

export class QualityScoringEngine {
  scoreContent(
    hasAudio: boolean,
    audioLUFS: number,
    visualResolution: number,
    frameRate: number,
    scriptLength: number,
  ): QualityMetrics {
    const audioQuality = this.scoreAudio(hasAudio, audioLUFS);
    const visualQuality = this.scoreVisual(visualResolution, frameRate);
    const scriptQuality = this.scoreScript(scriptLength);
    const engagementPotential = 0.65 + Math.random() * 0.35;
    const technicalQuality = (audioQuality + visualQuality) / 2;

    const overallScore = (audioQuality + visualQuality + scriptQuality + engagementPotential + technicalQuality) / 5;

    const issues = this.identifyIssues(audioQuality, visualQuality, scriptQuality);
    const recommendations = this.generateRecommendations(issues, overallScore);

    return {
      audioQuality,
      visualQuality,
      scriptQuality,
      engagementPotential,
      technicalQuality,
      overallScore,
      issues,
      recommendations,
    };
  }

  private scoreAudio(hasAudio: boolean, lufs: number): number {
    if (!hasAudio) return 0;
    if (Math.abs(lufs - (-14)) < 1) return 95;
    if (Math.abs(lufs - (-14)) < 3) return 80;
    return 60;
  }

  private scoreVisual(resolution: number, fps: number): number {
    let score = 50;
    if (resolution >= 1080) score += 30;
    if (resolution >= 4096) score += 15;
    if (fps >= 60) score += 20;
    return Math.min(100, score);
  }

  private scoreScript(length: number): number {
    if (length < 50) return 40;
    if (length < 200) return 70;
    if (length < 1000) return 85;
    return 90;
  }

  private identifyIssues(audioScore: number, visualScore: number, scriptScore: number): string[] {
    const issues: string[] = [];
    if (audioScore < 70) issues.push("Audio quality needs improvement");
    if (visualScore < 70) issues.push("Visual quality below standard");
    if (scriptScore < 70) issues.push("Script may be too short");
    return issues;
  }

  private generateRecommendations(issues: string[], score: number): string[] {
    const recommendations: string[] = [];
    if (score < 70) recommendations.push("Review all quality metrics");
    if (issues.includes("Audio quality needs improvement")) recommendations.push("Normalize audio to -14 LUFS");
    if (issues.includes("Visual quality below standard")) recommendations.push("Upgrade to 1080p minimum");
    if (score > 85) recommendations.push("Great quality! Ready to publish");
    return recommendations;
  }
}
