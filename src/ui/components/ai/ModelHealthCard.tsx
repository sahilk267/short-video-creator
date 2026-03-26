import React from "react";
import { Alert, Chip, Grid, Paper, Stack, Typography } from "@mui/material";
import type { AIMetricsData } from "../../hooks/useAIMetrics";

interface ModelHealthCardProps {
  data: AIMetricsData | null;
  loading?: boolean;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export const ModelHealthCard: React.FC<ModelHealthCardProps> = ({ data, loading = false }) => {
  const metrics = data?.metrics;
  const health = data?.health;
  const model = data?.model;

  return (
    <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <div>
            <Typography variant="h6" fontWeight={700}>
              Model health
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Accuracy, precision, recall, drift, and fallback state.
            </Typography>
          </div>
          <Chip
            label={health?.healthy ? "Healthy" : "Attention needed"}
            color={health?.healthy ? "success" : "warning"}
            variant={health?.healthy ? "filled" : "outlined"}
          />
        </Stack>

        <Grid container spacing={2}>
          {[
            { label: "Accuracy", value: formatPercent(metrics?.accuracy ?? 0) },
            { label: "Precision", value: formatPercent(metrics?.precision ?? 0) },
            { label: "Recall", value: formatPercent(metrics?.recall ?? 0) },
            { label: "Drift", value: formatPercent(metrics?.drift ?? 0) },
          ].map((item) => (
            <Grid item xs={6} md={3} key={item.label}>
              <Paper sx={{ p: 2, backgroundColor: "grey.50" }}>
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {loading ? "--" : item.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Chip label={`Model v${model?.version ?? 1}`} size="small" variant="outlined" />
          <Chip label={`${model?.samples ?? 0} samples`} size="small" variant="outlined" />
          <Chip label={`Bias risk: ${model?.metrics.biasRisk ?? "low"}`} size="small" color={model?.metrics.biasRisk === "high" ? "error" : model?.metrics.biasRisk === "medium" ? "warning" : "success"} variant="outlined" />
          <Chip label={health?.fallbackMode ? "Fallback enabled" : "Primary model active"} size="small" color={health?.fallbackMode ? "warning" : "success"} />
        </Stack>

        {!!health?.reasons.length && (
          <Alert severity="warning">
            Health check reasons: {health.reasons.join(", ")}
          </Alert>
        )}
      </Stack>
    </Paper>
  );
};

export default ModelHealthCard;