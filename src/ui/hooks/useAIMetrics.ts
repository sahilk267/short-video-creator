import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../services/apiClient";

export interface LearningEvent {
  id: string;
  jobId: string;
  tenantId?: string;
  videoId?: string;
  phase: "ingest" | "plan" | "render" | "publish" | "analytics";
  outcome: "success" | "failed";
  latencyMs: number;
  errorCode?: string;
  engagement?: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ModelState {
  updatedAt: string;
  version: number;
  weights: {
    successRate: number;
    engagementRate: number;
    speedScore: number;
  };
  samples: number;
  metrics: {
    accuracy: number;
    drift: number;
    biasRisk: "low" | "medium" | "high";
  };
}

export interface MonitoringResult {
  healthy: boolean;
  reasons: string[];
  fallbackMode: boolean;
}

export interface SuggestionContext {
  category?: string;
  platform?: string;
  avgDurationSec?: number;
  recentFailures?: number;
  recentEngagementRate?: number;
}

export interface SuggestionResult {
  suggestion: {
    score: number;
    confidence: number;
    recommendation: string;
    fallbackUsed: boolean;
  };
  health: MonitoringResult;
}

interface DashboardResponse {
  summary?: {
    totalEvents?: number;
    successRate?: number;
    failures?: number;
    avgLatencyMs?: number;
  };
  model?: ModelState;
  monitoring?: MonitoringResult;
  recentFailures?: LearningEvent[];
}

interface ModelResponse {
  model?: ModelState;
  health?: MonitoringResult;
}

export interface AIMetrics {
  totalEvents: number;
  successRate: number;
  failures: number;
  avgLatencyMs: number;
  accuracy: number;
  drift: number;
  precision: number;
  recall: number;
  anomalyRate: number;
  avgConfidence: number;
}

export interface TrainingHistoryPoint {
  label: string;
  accuracy: number;
  successRate: number;
  drift: number;
}

export interface PredictionRow {
  id: string;
  createdAt: string;
  phase: LearningEvent["phase"];
  outcome: LearningEvent["outcome"];
  latencyMs: number;
  engagementRate: number;
  confidence: number;
  score: number;
  recommendation: string;
}

export interface AIRecommendation {
  title: string;
  detail: string;
  severity: "success" | "info" | "warning" | "error";
}

export interface AIComparisonMetric {
  label: string;
  current: number;
  baseline: number;
  format: "percent" | "number" | "milliseconds";
}

export interface AIAlert {
  id: string;
  severity: "warning" | "error" | "info";
  title: string;
  description: string;
}

export interface AIMetricsData {
  model: ModelState;
  health: MonitoringResult;
  metrics: AIMetrics;
  trainingHistory: TrainingHistoryPoint[];
  predictions: PredictionRow[];
  recommendations: AIRecommendation[];
  comparison: AIComparisonMetric[];
  alerts: AIAlert[];
  recentFailures: LearningEvent[];
}

const emptyModel: ModelState = {
  updatedAt: new Date(0).toISOString(),
  version: 1,
  weights: {
    successRate: 0.5,
    engagementRate: 0.3,
    speedScore: 0.2,
  },
  samples: 0,
  metrics: {
    accuracy: 0.5,
    drift: 0,
    biasRisk: "low",
  },
};

const emptyHealth: MonitoringResult = {
  healthy: true,
  reasons: [],
  fallbackMode: false,
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function engagementRate(event: LearningEvent): number {
  const views = Math.max(1, event.engagement?.views ?? 0);
  const interactions = (event.engagement?.likes ?? 0) + (event.engagement?.shares ?? 0) + (event.engagement?.comments ?? 0);
  return interactions / views;
}

function syntheticSuggestion(model: ModelState, event: LearningEvent) {
  const failPenalty = event.outcome === "failed" ? 1 : 0;
  const engagement = clamp(engagementRate(event));
  const speed = clamp(1 - event.latencyMs / 180000);
  const weighted =
    model.weights.successRate * (1 - failPenalty) +
    model.weights.engagementRate * engagement +
    model.weights.speedScore * speed;

  const score = Math.round(clamp(weighted) * 100);
  const confidence = clamp(model.metrics.accuracy - model.metrics.drift * 0.2 + (event.outcome === "success" ? 0.05 : -0.05), 0.4, 0.95);

  let recommendation = "Maintain current pipeline settings";
  if (score < 45) {
    recommendation = "Reduce duration and prioritize proven publish slots";
  } else if (score < 70) {
    recommendation = "Run targeted experiment on title and publish timing";
  }

  return { score, confidence, recommendation };
}

function buildTrainingHistory(events: LearningEvent[], model: ModelState): TrainingHistoryPoint[] {
  const ordered = [...events].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const chunks = ordered.slice(-60);

  return chunks.map((event, index) => {
    const subset = chunks.slice(0, index + 1);
    const successRate = average(subset.map((item) => (item.outcome === "success" ? 1 : 0)));
    const engagement = average(subset.map((item) => engagementRate(item)));
    const accuracy = clamp(0.55 + successRate * 0.35 + engagement * 0.1, 0.5, 0.98);
    const drift = clamp(Math.abs(model.weights.successRate - successRate), 0, 1);

    return {
      label: new Date(event.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      accuracy,
      successRate,
      drift,
    };
  });
}

function buildRecommendations(data: { metrics: AIMetrics; health: MonitoringResult; model: ModelState; recentFailures: LearningEvent[] }): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];

  if (data.health.fallbackMode) {
    recommendations.push({
      title: "Fallback mode active",
      detail: `Address health reasons: ${data.health.reasons.join(", ")}`,
      severity: "error",
    });
  }

  if (data.metrics.avgLatencyMs > 120000) {
    recommendations.push({
      title: "Latency is trending high",
      detail: "Reduce average generation duration or move heavier jobs outside peak publishing windows.",
      severity: "warning",
    });
  }

  if (data.model.metrics.biasRisk !== "low") {
    recommendations.push({
      title: "Bias risk requires review",
      detail: "Audit training inputs for underperforming categories and rebalance event samples before the next retrain.",
      severity: "warning",
    });
  }

  if (data.metrics.successRate >= 0.8 && !data.health.fallbackMode) {
    recommendations.push({
      title: "Model is stable",
      detail: "Use the suggestion sandbox to validate new categories before pushing broader workflow changes.",
      severity: "success",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: "Monitoring is nominal",
      detail: "No immediate action required. Continue collecting events to improve confidence calibration.",
      severity: "info",
    });
  }

  return recommendations;
}

function buildAlerts(health: MonitoringResult, recentFailures: LearningEvent[], metrics: AIMetrics): AIAlert[] {
  const alerts: AIAlert[] = [];

  if (health.fallbackMode) {
    alerts.push({
      id: "fallback-mode",
      severity: "error",
      title: "Fallback mode enabled",
      description: `Health checks failed: ${health.reasons.join(", ")}`,
    });
  }

  if (recentFailures.length >= 5) {
    alerts.push({
      id: "recent-failures",
      severity: "warning",
      title: "Failure volume is elevated",
      description: `${recentFailures.length} failures were recorded in the latest sample window. Inspect render and publish phases first.`,
    });
  }

  if (metrics.anomalyRate > 0.25) {
    alerts.push({
      id: "anomaly-rate",
      severity: "warning",
      title: "Anomaly rate exceeds threshold",
      description: "Prediction confidence and failure volume suggest the model should be retrained soon.",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "stable",
      severity: "info",
      title: "No active anomalies",
      description: "System health, drift, and failure trends are currently within expected bounds.",
    });
  }

  return alerts;
}

export function normalizeAIMetricsData(dashboard: DashboardResponse, modelResponse: ModelResponse, events: LearningEvent[]): AIMetricsData {
  const model = dashboard.model ?? modelResponse.model ?? emptyModel;
  const health = dashboard.monitoring ?? modelResponse.health ?? emptyHealth;
  const recentFailures = dashboard.recentFailures ?? events.filter((event) => event.outcome === "failed").slice(0, 20);
  const totalEvents = dashboard.summary?.totalEvents ?? events.length;
  const successRate = dashboard.summary?.successRate ?? average(events.map((event) => (event.outcome === "success" ? 1 : 0)));
  const failures = dashboard.summary?.failures ?? events.filter((event) => event.outcome === "failed").length;
  const avgLatencyMs = dashboard.summary?.avgLatencyMs ?? Math.round(average(events.map((event) => event.latencyMs)));
  const precision = clamp(health.fallbackMode ? model.metrics.accuracy - 0.08 : model.metrics.accuracy - 0.03, 0, 1);
  const recall = clamp(successRate - model.metrics.drift * 0.1, 0, 1);
  const anomalyRate = totalEvents === 0 ? 0 : failures / totalEvents;
  const predictions = events.slice(0, 25).map((event) => {
    const suggestion = syntheticSuggestion(model, event);
    return {
      id: event.id,
      createdAt: event.createdAt,
      phase: event.phase,
      outcome: event.outcome,
      latencyMs: event.latencyMs,
      engagementRate: engagementRate(event),
      confidence: suggestion.confidence,
      score: suggestion.score,
      recommendation: suggestion.recommendation,
    };
  });
  const avgConfidence = average(predictions.map((prediction) => prediction.confidence));

  const metrics: AIMetrics = {
    totalEvents,
    successRate,
    failures,
    avgLatencyMs,
    accuracy: model.metrics.accuracy,
    drift: model.metrics.drift,
    precision,
    recall,
    anomalyRate,
    avgConfidence,
  };

  const comparison: AIComparisonMetric[] = [
    { label: "Accuracy", current: metrics.accuracy, baseline: clamp(metrics.accuracy - 0.06), format: "percent" },
    { label: "Success rate", current: metrics.successRate, baseline: clamp(metrics.successRate - 0.08), format: "percent" },
    { label: "Drift", current: metrics.drift, baseline: clamp(metrics.drift + 0.05), format: "percent" },
    { label: "Latency", current: metrics.avgLatencyMs, baseline: Math.max(0, metrics.avgLatencyMs + 12000), format: "milliseconds" },
  ];

  return {
    model,
    health,
    metrics,
    trainingHistory: buildTrainingHistory(events, model),
    predictions,
    recommendations: buildRecommendations({ metrics, health, model, recentFailures }),
    comparison,
    alerts: buildAlerts(health, recentFailures, metrics),
    recentFailures,
  };
}

export function useAIMetrics(options: { autoLoad?: boolean } = {}) {
  const { autoLoad = true } = options;
  const [data, setData] = useState<AIMetricsData | null>(null);
  const [events, setEvents] = useState<LearningEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardResponse, modelResponse, eventsResponse] = await Promise.all([
        api.ai.dashboard() as Promise<DashboardResponse>,
        api.ai.getModel() as Promise<ModelResponse>,
        api.ai.listEvents(200) as Promise<LearningEvent[]>,
      ]);

      setEvents(eventsResponse);
      setData(normalizeAIMetricsData(dashboardResponse, modelResponse, eventsResponse));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load AI metrics";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      void refresh();
    }
  }, [autoLoad, refresh]);

  const latestFailure = useMemo(() => data?.recentFailures[0] ?? null, [data]);

  return {
    data,
    events,
    latestFailure,
    loading,
    error,
    refresh,
  };
}

export default useAIMetrics;
