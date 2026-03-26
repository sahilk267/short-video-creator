/**
 * PublishStatusTracker Component - Monitor publishing progress
 */

import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import PendingIcon from "@mui/icons-material/Pending";

interface PublishJob {
  jobId: string;
  platform: string;
  videoId: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  progress?: number;
}

interface PublishStatusTrackerProps {
  jobIds: string[];
  onRefresh?: () => void;
  isLoading?: boolean;
  jobs?: PublishJob[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircleIcon sx={{ color: "#4caf50" }} />;
    case "failed":
      return <ErrorIcon sx={{ color: "#f44336" }} />;
    case "processing":
      return (
        <CircularProgress
          size={24}
          sx={{ color: "#2196f3" }}
        />
      );
    case "pending":
      return <PendingIcon sx={{ color: "#ff9800" }} />;
    default:
      return null;
  }
};

const getStatusColor = (
  status: string
): "success" | "error" | "warning" | "info" | "default" => {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
      return "error";
    case "processing":
      return "info";
    case "pending":
      return "warning";
    default:
      return "default";
  }
};

export const PublishStatusTracker: React.FC<PublishStatusTrackerProps> = ({
  jobIds,
  onRefresh,
  isLoading = false,
  jobs = [],
}) => {
  const completedJobs = jobs.filter((j) => j.status === "completed").length;
  const failedJobs = jobs.filter((j) => j.status === "failed").length;
  const processingJobs = jobs.filter((j) => j.status === "processing").length;
  const pendingJobs = jobs.filter((j) => j.status === "pending").length;

  const allCompleted = jobs.length > 0 && processingJobs === 0 && pendingJobs === 0;
  const hasErrors = failedJobs > 0;

  return (
    <Box>
      <Stack spacing={3}>
        {/* Summary Cards */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Card sx={{ flex: 1, backgroundColor: "#f5f5f5" }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h5">
                {pendingJobs}
                <Typography
                  component="span"
                  sx={{ fontSize: "0.5em", ml: 1, color: "textSecondary" }}
                >
                  / {jobs.length}
                </Typography>
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, backgroundColor: "#f5f5f5" }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Processing
              </Typography>
              <Typography variant="h5">
                {processingJobs}
                <Typography
                  component="span"
                  sx={{ fontSize: "0.5em", ml: 1, color: "textSecondary" }}
                >
                  / {jobs.length}
                </Typography>
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, backgroundColor: "#f5f5f5" }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h5" sx={{ color: "#4caf50" }}>
                {completedJobs}
                <Typography
                  component="span"
                  sx={{ fontSize: "0.5em", ml: 1, color: "textSecondary" }}
                >
                  / {jobs.length}
                </Typography>
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, backgroundColor: "#f5f5f5" }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Failed
              </Typography>
              <Typography variant="h5" sx={{ color: "#f44336" }}>
                {failedJobs}
                <Typography
                  component="span"
                  sx={{ fontSize: "0.5em", ml: 1, color: "textSecondary" }}
                >
                  / {jobs.length}
                </Typography>
              </Typography>
            </CardContent>
          </Card>
        </Stack>

        {/* Status Message */}
        {allCompleted && (
          <Alert severity="success" icon={<CheckCircleIcon />}>
            🎉 All videos published successfully!
          </Alert>
        )}
        {hasErrors && !allCompleted && (
          <Alert severity="warning">
            ⚠️ Some videos failed to publish. Check the details below and retry if needed.
          </Alert>
        )}
        {!allCompleted && !hasErrors && (
          <Alert severity="info" icon={<CircularProgress size={20} />}>
            Publishing in progress... Please wait.
          </Alert>
        )}

        {jobs.length === 0 && jobIds.length > 0 && (
          <Alert severity="info">Loading publish status...</Alert>
        )}

        {/* Refresh Button */}
        <Button
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          disabled={isLoading}
          variant="outlined"
        >
          {isLoading ? "Refreshing..." : "Refresh Status"}
        </Button>

        {/* Jobs Table */}
        {jobs.length > 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell>
                    <strong>Platform</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Video ID</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Progress</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Time</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.jobId} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {job.platform.toUpperCase()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                        {job.videoId.substring(0, 12)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {getStatusIcon(job.status)}
                        <Chip
                          label={job.status.toUpperCase()}
                          size="small"
                          color={getStatusColor(job.status)}
                          variant="outlined"
                        />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {job.status === "processing" && job.progress !== undefined ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CircularProgress
                            variant="determinate"
                            value={job.progress}
                            size={30}
                          />
                          <Typography variant="caption">{job.progress}%</Typography>
                        </Box>
                      ) : job.status === "completed" ? (
                        <Chip label="100%" variant="outlined" color="success" size="small" />
                      ) : job.status === "failed" ? (
                        <Chip label="0%" variant="outlined" color="error" size="small" />
                      ) : (
                        <Typography variant="caption" color="textSecondary">
                          Queued
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="textSecondary">
                        {job.completedAt
                          ? new Date(job.completedAt).toLocaleTimeString()
                          : new Date(job.createdAt).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Error Details */}
        {jobs.some((j) => j.errorMessage) && (
          <Stack spacing={1}>
            <Typography variant="subtitle2" fontWeight={600}>
              Error Details:
            </Typography>
            {jobs
              .filter((j) => j.errorMessage)
              .map((job) => (
                <Paper
                  key={job.jobId}
                  sx={{
                    p: 2,
                    backgroundColor: "#ffebee",
                    border: "1px solid #ef5350",
                  }}
                >
                  <Typography variant="subtitle2">
                    {job.platform.toUpperCase()} - {job.videoId.substring(0, 12)}...
                  </Typography>
                  <Typography variant="body2" color="error">
                    {job.errorMessage}
                  </Typography>
                </Paper>
              ))}
          </Stack>
        )}

        {/* Job IDs List */}
        <Paper sx={{ p: 2, backgroundColor: "#fafafa" }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Job IDs:
          </Typography>
          {jobIds.map((id) => (
            <Typography
              key={id}
              variant="caption"
              sx={{ display: "block", fontFamily: "monospace", mb: 0.5 }}
            >
              • {id}
            </Typography>
          ))}
        </Paper>
      </Stack>
    </Box>
  );
};

export default PublishStatusTracker;
