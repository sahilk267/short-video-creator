import React from "react";
import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { PredictionRow } from "../../hooks/useAIMetrics";

interface PredictionsListProps {
  predictions: PredictionRow[];
  loading?: boolean;
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export const PredictionsList: React.FC<PredictionsListProps> = ({ predictions, loading = false }) => {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
        Predictions and outcomes
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Recent event-derived predictions, confidence estimates, and recommended actions.
      </Typography>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Time</TableCell>
            <TableCell>Phase</TableCell>
            <TableCell>Outcome</TableCell>
            <TableCell>Score</TableCell>
            <TableCell>Confidence</TableCell>
            <TableCell>Latency</TableCell>
            <TableCell>Recommendation</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {predictions.map((prediction) => (
            <TableRow key={prediction.id} hover>
              <TableCell>{new Date(prediction.createdAt).toLocaleString()}</TableCell>
              <TableCell>
                <Chip label={prediction.phase} size="small" variant="outlined" />
              </TableCell>
              <TableCell>
                <Chip label={prediction.outcome} size="small" color={prediction.outcome === "success" ? "success" : "error"} variant="outlined" />
              </TableCell>
              <TableCell>{prediction.score}</TableCell>
              <TableCell>{pct(prediction.confidence)}</TableCell>
              <TableCell>{Math.round(prediction.latencyMs / 1000)}s</TableCell>
              <TableCell>
                <Typography variant="body2">{prediction.recommendation}</Typography>
                <Typography variant="caption" color="text.secondary">Engagement rate {pct(prediction.engagementRate)}</Typography>
              </TableCell>
            </TableRow>
          ))}
          {!loading && predictions.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>
                <Typography variant="body2" color="text.secondary">
                  No prediction history yet. Record AI events to populate this table.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default PredictionsList;