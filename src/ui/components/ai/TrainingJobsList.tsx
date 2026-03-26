import React from "react";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import type { AIMetricsData } from "../../hooks/useAIMetrics";

interface TrainingJobsListProps {
  data: AIMetricsData | null;
  loading?: boolean;
  training?: boolean;
  onTrain: () => void | Promise<void>;
}

function percent(value: number): number {
  return Math.round(value * 100);
}

export const TrainingJobsList: React.FC<TrainingJobsListProps> = ({ data, loading = false, training = false, onTrain }) => {
  const rows = [
    {
      name: "Current model",
      status: data?.health.fallbackMode ? "fallback" : "ready",
      progress: data?.metrics.accuracy ?? 0,
      eta: "On demand",
      detail: `Version ${data?.model.version ?? 1} · updated ${data?.model.updatedAt ? new Date(data.model.updatedAt).toLocaleString() : "n/a"}`,
    },
    {
      name: "Retrain queue",
      status: training ? "running" : "idle",
      progress: training ? 0.65 : Math.min(1, (data?.model.samples ?? 0) / 1000),
      eta: training ? "~30 sec" : "Manual trigger",
      detail: `${data?.model.samples ?? 0} events ready for the next retrain window`,
    },
  ];

  return (
    <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <div>
            <Typography variant="h6" fontWeight={700}>
              Training jobs
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Current model state and manual retraining controls.
            </Typography>
          </div>
          <Button
            variant="contained"
            size="small"
            startIcon={<PlayArrowIcon />}
            onClick={() => void onTrain()}
            disabled={training || loading}
          >
            {training ? "Retraining..." : "Retrain model"}
          </Button>
        </Stack>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Job</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>ETA</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name}>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{row.detail}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={row.status}
                    size="small"
                    color={row.status === "ready" ? "success" : row.status === "running" ? "primary" : row.status === "fallback" ? "warning" : "default"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell sx={{ minWidth: 180 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LinearProgress variant="determinate" value={percent(row.progress)} sx={{ flex: 1, height: 8, borderRadius: 999 }} />
                    <Typography variant="caption" color="text.secondary">{percent(row.progress)}%</Typography>
                  </Box>
                </TableCell>
                <TableCell>{row.eta}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Stack>
    </Paper>
  );
};

export default TrainingJobsList;