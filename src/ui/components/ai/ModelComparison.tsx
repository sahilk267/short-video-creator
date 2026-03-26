import React from "react";
import { Box, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import type { AIComparisonMetric } from "../../hooks/useAIMetrics";

interface ModelComparisonProps {
  metrics: AIComparisonMetric[];
}

function formatValue(value: number, format: AIComparisonMetric["format"]): string {
  if (format === "percent") {
    return `${Math.round(value * 100)}%`;
  }
  if (format === "milliseconds") {
    return `${Math.round(value)} ms`;
  }
  return `${Math.round(value)}`;
}

function normalize(value: number, format: AIComparisonMetric["format"]): number {
  if (format === "milliseconds") {
    return Math.min(100, Math.max(0, 100 - value / 2500));
  }
  if (format === "percent") {
    return Math.min(100, Math.max(0, value * 100));
  }
  return Math.min(100, Math.max(0, value));
}

export const ModelComparison: React.FC<ModelComparisonProps> = ({ metrics }) => {
  return (
    <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
      <Stack spacing={2}>
        <div>
          <Typography variant="h6" fontWeight={700}>Model comparison</Typography>
          <Typography variant="body2" color="text.secondary">
            Current model metrics compared with a prior baseline snapshot.
          </Typography>
        </div>

        {metrics.map((metric) => (
          <Box key={metric.label}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
              <Typography variant="body2" fontWeight={600}>{metric.label}</Typography>
              <Typography variant="caption" color="text.secondary">
                Current {formatValue(metric.current, metric.format)} · Baseline {formatValue(metric.baseline, metric.format)}
              </Typography>
            </Stack>
            <Stack spacing={0.75}>
              <LinearProgress variant="determinate" value={normalize(metric.current, metric.format)} sx={{ height: 8, borderRadius: 999 }} />
              <LinearProgress variant="determinate" value={normalize(metric.baseline, metric.format)} color="secondary" sx={{ height: 6, borderRadius: 999, opacity: 0.65 }} />
            </Stack>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};

export default ModelComparison;