/**
 * PlatformComparison Component - Horizontal bar chart comparing platform metrics
 */

import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Skeleton,
} from "@mui/material";
import { PlatformMetrics } from "../../hooks/useAnalytics";

interface PlatformComparisonProps {
  data: PlatformMetrics[];
  loading?: boolean;
}

type MetricKey = "views" | "likes" | "shares" | "comments" | "ctr";

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#FF0000",
  telegram: "#0088cc",
  instagram: "#C13584",
  facebook: "#1877F2",
};

const METRICS: { key: MetricKey; label: string }[] = [
  { key: "views", label: "Views" },
  { key: "likes", label: "Likes" },
  { key: "shares", label: "Shares" },
  { key: "comments", label: "Comments" },
  { key: "ctr", label: "CTR %" },
];

function formatValue(v: number, key: MetricKey): string {
  if (key === "ctr") return `${(v || 0).toFixed(2)}%`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return (v || 0).toLocaleString();
}

export const PlatformComparison: React.FC<PlatformComparisonProps> = ({
  data,
  loading = false,
}) => {
  const [metric, setMetric] = useState<MetricKey>("views");

  if (loading) return <Skeleton variant="rounded" height={300} />;

  const maxVal = Math.max(...data.map((p) => p[metric] || 0), 1);

  // Sort by selected metric desc
  const sorted = [...data].sort((a, b) => (b[metric] || 0) - (a[metric] || 0));

  return (
    <Paper sx={{ p: 3, height: "100%" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Platform Comparison
        </Typography>
        <ToggleButtonGroup
          value={metric}
          exclusive
          onChange={(_, val) => val && setMetric(val)}
          size="small"
        >
          {METRICS.map((m) => (
            <ToggleButton key={m.key} value={m.key} sx={{ px: 1.5, py: 0.5, fontSize: "0.75rem", textTransform: "none" }}>
              {m.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      {data.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
          <Typography variant="body2">No platform data available.</Typography>
        </Box>
      ) : (
        <Stack spacing={2.5}>
          {sorted.map((platform) => {
            const val = platform[metric] || 0;
            const pct = Math.round((val / maxVal) * 100);
            const color = PLATFORM_COLORS[platform.platform.toLowerCase()] || "#757575";

            return (
              <Box key={platform.platform}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ color }}>
                    {platform.platform.toUpperCase()}
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {formatValue(val, metric)}
                  </Typography>
                </Stack>
                <Tooltip title={`${platform.platform}: ${formatValue(val, metric)}`} placement="top">
                  <Box
                    sx={{
                      height: 28,
                      borderRadius: 1,
                      backgroundColor: "#f5f5f5",
                      position: "relative",
                      overflow: "hidden",
                      cursor: "help",
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${pct}%`,
                        backgroundColor: color,
                        opacity: 0.85,
                        transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                        borderRadius: 1,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        position: "absolute",
                        left: `${Math.min(pct, 90)}%`,
                        top: "50%",
                        transform: "translate(4px, -50%)",
                        color: pct > 85 ? "#fff" : color,
                        fontWeight: 600,
                      }}
                    >
                      {pct}%
                    </Typography>
                  </Box>
                </Tooltip>
              </Box>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
};

export default PlatformComparison;
