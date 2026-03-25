import type { LearningModelState } from "../db/AiLearningStore";
import type { AiSuggestion, SuggestionContext } from "./AiPredictionService";

export interface MonitoringResult {
  healthy: boolean;
  reasons: string[];
  fallbackMode: boolean;
}

export class AiMonitoringService {
  public evaluateModelHealth(model: LearningModelState): MonitoringResult {
    const reasons: string[] = [];

    if (model.metrics.accuracy < 0.58) {
      reasons.push("accuracy_below_threshold");
    }
    if (model.metrics.drift > 0.35) {
      reasons.push("model_drift_high");
    }
    if (model.metrics.biasRisk === "high") {
      reasons.push("bias_risk_high");
    }

    return {
      healthy: reasons.length === 0,
      reasons,
      fallbackMode: reasons.length > 0,
    };
  }

  public fallbackSuggestion(context: SuggestionContext): AiSuggestion {
    const categoryHint = context.category ? ` for ${context.category}` : "";
    return {
      score: 50,
      confidence: 0.45,
      recommendation: `Fallback mode: use proven posting slot and conservative metadata${categoryHint}`,
      fallbackUsed: true,
    };
  }
}
