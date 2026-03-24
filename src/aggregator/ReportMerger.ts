import { ReportRecord } from "../db/ReportStore";

export interface ScriptScene {
  text: string;
  source: string;
  link: string;
  category: string;
  pubDate: string;
}

export interface ScriptPlan {
  id: string;
  category: string;
  createdAt: string;
  scenes: ScriptScene[];
  estimatedDurationSeconds: number;
}

export class ReportMerger {
  static mergeReports(reports: ReportRecord[], category: string, maxDurationSec: number): ScriptPlan {
    const filtered = reports
      .filter((r) => r.category.toLowerCase() === category.toLowerCase())
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    const scenes: ScriptScene[] = [];
    let duration = 0;

    for (const report of filtered) {
      const words = report.content.split(/\s+/).filter(Boolean).length;
      const estSceneDuration = Math.min(Math.max(words * 0.4, 5), 30);

      if (duration + estSceneDuration > maxDurationSec) {
        break;
      }

      scenes.push({
        text: `${report.title}: ${report.content}`.slice(0, 400),
        source: report.sourceName,
        link: report.link,
        category: report.category,
        pubDate: report.pubDate,
      });

      duration += estSceneDuration;
    }

    return {
      id: `plan_${Date.now()}`,
      category,
      createdAt: new Date().toISOString(),
      scenes,
      estimatedDurationSeconds: duration,
    };
  }
}
