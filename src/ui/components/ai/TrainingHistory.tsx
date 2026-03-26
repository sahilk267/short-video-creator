import React from "react";
import { Paper, Stack, Typography } from "@mui/material";
import type { TrainingHistoryPoint } from "../../hooks/useAIMetrics";

interface TrainingHistoryProps {
  data: TrainingHistoryPoint[];
  loading?: boolean;
}

function buildPath(values: number[], width: number, height: number): string {
  if (values.length === 0) return "";
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export const TrainingHistory: React.FC<TrainingHistoryProps> = ({ data, loading = false }) => {
  const width = 640;
  const height = 220;
  const accuracyPath = buildPath(data.map((point) => point.accuracy), width, height);
  const successPath = buildPath(data.map((point) => point.successRate), width, height);
  const driftPath = buildPath(data.map((point) => point.drift), width, height);

  return (
    <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
      <Stack spacing={2}>
        <div>
          <Typography variant="h6" fontWeight={700}>Training history</Typography>
          <Typography variant="body2" color="text.secondary">
            Accuracy, success rate, and drift trends over the latest event window.
          </Typography>
        </div>

        <svg viewBox={`0 0 ${width} ${height + 32}`} width="100%" role="img" aria-label="Training history chart">
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1="0"
              y1={height - ratio * height}
              x2={width}
              y2={height - ratio * height}
              stroke="#e0e0e0"
              strokeDasharray="4 4"
            />
          ))}
          <path d={accuracyPath} fill="none" stroke="#1976d2" strokeWidth="3" />
          <path d={successPath} fill="none" stroke="#2e7d32" strokeWidth="3" />
          <path d={driftPath} fill="none" stroke="#ed6c02" strokeWidth="3" />
          {data.filter((_, index) => index % Math.max(1, Math.ceil(data.length / 6)) === 0).map((point, index) => {
            const sourceIndex = data.findIndex((entry) => entry.label === point.label && entry.accuracy === point.accuracy) + index;
            const x = (Math.min(sourceIndex, data.length - 1) / Math.max(1, data.length - 1)) * width;
            return (
              <text key={`${point.label}-${index}`} x={x} y={height + 18} fontSize="11" textAnchor="middle" fill="#616161">
                {point.label}
              </text>
            );
          })}
        </svg>

        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Typography variant="caption" color="#1976d2">Accuracy</Typography>
          <Typography variant="caption" color="#2e7d32">Success rate</Typography>
          <Typography variant="caption" color="#ed6c02">Drift</Typography>
          {loading && <Typography variant="caption" color="text.secondary">Refreshing chart...</Typography>}
        </Stack>
      </Stack>
    </Paper>
  );
};

export default TrainingHistory;