/**
 * EngagementBreakdown Component - Stacked bars showing likes/shares/comments per platform
 */

import React from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Tooltip,
  LinearProgress,
  Skeleton,
  Chip,
} from "@mui/material";
import { PlatformMetrics } from "../../hooks/useAnalytics";

interface EngagementBreakdownProps {
  data: PlatformMetrics[];
  loading?: boolean;
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#FF0000",
  telegram: "#0088cc",
  instagram: "#C13584",
  facebook: "#1877F2",
};

const METRIC_COLORS = {
  likes: "#4caf50",
  shares: "#2196f3",
  comments: "#ff9800",
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export const EngagementBreakdown: React.FC<EngagementBreakdownProps> = ({
  data,
  loading = false,
}) => {
  if (loading) return <Skeleton variant="rounded" height={300} />;

  const maxTotal = Math.max(
    ...data.map((p) => (p.likes || 0) + (p.shares || 0) + (p.comments || 0)),
    1,
  );

  return (
    <Paper sx={{ p: 3, height: "100%" }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Engagement Breakdown
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        {Object.entries(METRIC_COLORS).map(([key, color]) => (
          <Chip
            key={key}
            size="small"
            label={key.charAt(0).toUpperCase() + key.slice(1)}
            sx={{ backgroundColor: color, color: "#fff", fontWeight: 500 }}
          />
        ))}
      </Stack>

      {data.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
          <Typography variant="body2">No engagement data available.</Typography>
        </Box>
      ) : (
        <Stack spacing={3}>
          {data.map((platform) => {
            const total = (platform.likes || 0) + (platform.shares || 0) + (platform.comments || 0);
            const likesWidth = total > 0 ? ((platform.likes || 0) / total) * 100 : 0;
            const sharesWidth = total > 0 ? ((platform.shares || 0) / total) * 100 : 0;
            const commentsWidth = total > 0 ? ((platform.comments || 0) / total) * 100 : 0;
            const overallPct = Math.round((total / maxTotal) * 100);
            const platformColor = PLATFORM_COLORS[platform.platform.toLowerCase()] || "#757575";

            return (
              <Box key={platform.platform}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ color: platformColor }}>
                    {platform.platform.toUpperCase()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {formatNumber(total)} total interactions
                  </Typography>
                </Stack>

                {/* Stacked breakdown bar */}
                <Tooltip
                  title={`Likes: ${formatNumber(platform.likes || 0)} | Shares: ${formatNumber(platform.shares || 0)} | Comments: ${formatNumber(platform.comments || 0)}`}
                  placement="top"
                >
                  <Box
                    sx={{
                      height: 20,
                      borderRadius: 1,
                      overflow: "hidden",
                      display: "flex",
                      backgroundColor: "#f5f5f5",
                      cursor: "help",
                    }}
                  >
                    <Box
                      sx={{
                        width: `${likesWidth}%`,
                        backgroundColor: METRIC_COLORS.likes,
                        transition: "width 0.5s ease",
                      }}
                    />
                    <Box
                      sx={{
                        width: `${sharesWidth}%`,
                        backgroundColor: METRIC_COLORS.shares,
                        transition: "width 0.5s ease",
                      }}
                    />
                    <Box
                      sx={{
                        width: `${commentsWidth}%`,
                        backgroundColor: METRIC_COLORS.comments,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </Box>
                </Tooltip>

                {/* Overall platform bar */}
                <Box sx={{ mt: 0.5 }}>
                  <LinearProgress
                    variant="determinate"
                    value={overallPct}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: "#e0e0e0",
                      "& .MuiLinearProgress-bar": { backgroundColor: platformColor },
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
};

export default EngagementBreakdown;
