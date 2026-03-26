/**
 * ContentHeatmap Component - Day x Hour grid showing when content performs best
 */

import React, { useMemo } from "react";
import { Box, Paper, Typography, Tooltip, Skeleton, Stack } from "@mui/material";

interface HeatmapDataPoint {
  day: number;  // 0=Sunday ... 6=Saturday
  hour: number; // 0-23
  value: number;
}

interface ContentHeatmapProps {
  data: HeatmapDataPoint[];
  loading?: boolean;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getColor(value: number, max: number): string {
  if (max === 0) return "#f5f5f5";
  const intensity = value / max;
  if (intensity === 0) return "#f5f5f5";
  if (intensity < 0.2) return "#bbdefb";
  if (intensity < 0.4) return "#64b5f6";
  if (intensity < 0.6) return "#2196f3";
  if (intensity < 0.8) return "#1565c0";
  return "#0d47a1";
}

function formatHour(h: number): string {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

export const ContentHeatmap: React.FC<ContentHeatmapProps> = ({ data, loading = false }) => {
  const grid = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of data) {
      map[`${d.day}-${d.hour}`] = d.value;
    }
    return map;
  }, [data]);

  const maxVal = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);

  // Legend thresholds
  const legendSteps = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * maxVal));

  if (loading) return <Skeleton variant="rounded" height={220} />;

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Content Performance Heatmap
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Best days &amp; hours for engagement
          </Typography>
        </Box>
        {/* Legend */}
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography variant="caption" color="textSecondary">Less</Typography>
          {legendSteps.map((step) => (
            <Tooltip key={step} title={`≥ ${step.toLocaleString()}`} placement="top">
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: 0.5,
                  backgroundColor: getColor(step, maxVal),
                  cursor: "help",
                }}
              />
            </Tooltip>
          ))}
          <Typography variant="caption" color="textSecondary">More</Typography>
        </Stack>
      </Stack>

      {data.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
          <Typography variant="body2">No heatmap data available for the selected period.</Typography>
        </Box>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ display: "inline-grid", gridTemplateColumns: "40px repeat(24, 1fr)", gap: "2px", minWidth: 700 }}>
            {/* Header row */}
            <Box /> {/* empty top-left cell */}
            {HOURS.map((h) => (
              <Box
                key={h}
                sx={{ textAlign: "center", fontSize: "0.6rem", color: "text.secondary", height: 16 }}
              >
                {h % 3 === 0 ? formatHour(h) : ""}
              </Box>
            ))}

            {/* Data rows */}
            {DAYS.map((day, di) => (
              <React.Fragment key={day}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "0.7rem",
                    color: "text.secondary",
                    fontWeight: 600,
                  }}
                >
                  {day}
                </Box>
                {HOURS.map((h) => {
                  const val = grid[`${di}-${h}`] || 0;
                  const color = getColor(val, maxVal);
                  return (
                    <Tooltip
                      key={h}
                      title={`${day} ${formatHour(h)}: ${val.toLocaleString()} interactions`}
                      placement="top"
                    >
                      <Box
                        sx={{
                          width: "100%",
                          paddingBottom: "100%",
                          borderRadius: 0.5,
                          backgroundColor: color,
                          cursor: "help",
                          transition: "transform 0.15s",
                          "&:hover": { transform: "scale(1.3)", zIndex: 1 },
                        }}
                      />
                    </Tooltip>
                  );
                })}
              </React.Fragment>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default ContentHeatmap;
