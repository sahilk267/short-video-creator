/**
 * ScheduleHistory – execution history view with outcome timeline
 */

import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Divider,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import type { RenderJob, PublishJob } from "../../hooks/useScheduledJobs";

interface ScheduleHistoryProps {
  renderJobs: RenderJob[];
  publishJobs: PublishJob[];
  loading: boolean;
}

type HistoryFilter = "all" | "completed" | "failed" | "pending";

interface HistoryEntry {
  id: string;
  type: "render" | "publish";
  status: string;
  label: string;
  detail: string;
  createdAt: string;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  completed: <CheckCircleIcon sx={{ fontSize: 16, color: "success.main" }} />,
  failed: <ErrorIcon sx={{ fontSize: 16, color: "error.main" }} />,
  pending: <HourglassEmptyIcon sx={{ fontSize: 16, color: "warning.main" }} />,
  queued: <HourglassEmptyIcon sx={{ fontSize: 16, color: "warning.main" }} />,
  processing: <AutorenewIcon sx={{ fontSize: 16, color: "info.main" }} />,
};

const STATUS_COLOR: Record<string, "default" | "success" | "error" | "warning" | "info"> = {
  completed: "success",
  failed: "error",
  pending: "warning",
  queued: "warning",
  processing: "info",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return "";
  }
}

export const ScheduleHistory: React.FC<ScheduleHistoryProps> = ({
  renderJobs,
  publishJobs,
  loading,
}) => {
  const [filter, setFilter] = useState<HistoryFilter>("all");

  const history = useMemo<HistoryEntry[]>(() => {
    const renderEntries: HistoryEntry[] = renderJobs.map((j) => ({
      id: j.id,
      type: "render",
      status: j.status,
      label: `Render: ${j.category} / ${j.orientation}`,
      detail: `Type: ${j.videoType} — Lang: ${j.language}`,
      createdAt: j.createdAt,
    }));

    const publishEntries: HistoryEntry[] = publishJobs.map((j) => ({
      id: j.id,
      type: "publish",
      status: j.status,
      label: `Publish: ${j.platform}`,
      detail: j.title || j.videoId || j.id,
      createdAt: j.createdAt,
    }));

    const all = [...renderEntries, ...publishEntries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (filter === "all") return all;
    return all.filter((e) => e.status === filter || (filter === "pending" && (e.status === "pending" || e.status === "queued")));
  }, [renderJobs, publishJobs, filter]);

  const stats = useMemo(() => {
    const all = [...renderJobs, ...publishJobs];
    return {
      total: all.length,
      completed: all.filter((j) => j.status === "completed").length,
      failed: all.filter((j) => j.status === "failed").length,
      pending: all.filter((j) => j.status === "pending" || j.status === "queued").length,
    };
  }, [renderJobs, publishJobs]);

  return (
    <Box>
      {/* Summary stats */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight={700}>{stats.total}</Typography>
          <Typography variant="caption" color="text.secondary">Total</Typography>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight={700} color="success.main">{stats.completed}</Typography>
          <Typography variant="caption" color="text.secondary">Completed</Typography>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight={700} color="error.main">{stats.failed}</Typography>
          <Typography variant="caption" color="text.secondary">Failed</Typography>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight={700} color="warning.main">{stats.pending}</Typography>
          <Typography variant="caption" color="text.secondary">Pending</Typography>
        </Box>
      </Stack>

      {/* Filter */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <TextField
          select
          size="small"
          label="Filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value as HistoryFilter)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="failed">Failed</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
        </TextField>
        <Typography variant="caption" color="text.secondary">
          Showing {history.length} entries
        </Typography>
      </Stack>

      {loading && <LinearProgress sx={{ mb: 1 }} />}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.50" }}>
              <TableCell width={24} />
              <TableCell>Task</TableCell>
              <TableCell>Detail</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3, color: "text.secondary" }}>
                  No history entries
                </TableCell>
              </TableRow>
            ) : (
              history.slice(0, 100).map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell padding="checkbox">
                    {STATUS_ICON[entry.status] ?? null}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                      {entry.label}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                      {entry.detail}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={entry.type}
                      size="small"
                      variant="outlined"
                      color={entry.type === "render" ? "primary" : "secondary"}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={entry.status}
                      size="small"
                      color={STATUS_COLOR[entry.status] ?? "default"}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {timeAgo(entry.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{formatDate(entry.createdAt)}</Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ScheduleHistory;
