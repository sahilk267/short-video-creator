/**
 * TimeSeriesChart Component - SVG line chart for views/engagement over time
 */

import React, { useMemo } from "react";
import { Box, Typography, Paper, Stack, Chip, Skeleton } from "@mui/material";
import { TimeSeriesPoint } from "../../hooks/useAnalytics";

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
  loading?: boolean;
  title?: string;
}

const CHART_WIDTH = 800;
const CHART_HEIGHT = 200;
const PADDING = { top: 20, right: 20, bottom: 40, left: 60 };

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatYLabel(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  loading = false,
  title = "Views & Engagement Over Time",
}) => {
  const { viewsPath, engagementPath, yMax, xLabels, yLabels } = useMemo(() => {
    if (!data || data.length < 2) {
      return { viewsPath: "", engagementPath: "", yMax: 0, xLabels: [], yLabels: [] };
    }

    const innerW = CHART_WIDTH - PADDING.left - PADDING.right;
    const innerH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

    const maxViews = Math.max(...data.map((d) => d.views || 0), 1);
    const maxEngagement = Math.max(...data.map((d) => d.engagement || 0), 1);
    const yMax = Math.max(maxViews, maxEngagement);

    const xScale = (i: number) => PADDING.left + (i / (data.length - 1)) * innerW;
    const yScale = (val: number) => PADDING.top + innerH - (val / yMax) * innerH;

    const toPath = (values: number[]) =>
      values
        .map((v, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(v).toFixed(1)}`)
        .join(" ");

    const viewsPath = toPath(data.map((d) => d.views || 0));
    const engagementPath = toPath(data.map((d) => d.engagement || 0));

    // X labels: show up to 8 evenly spaced
    const step = Math.max(1, Math.floor(data.length / 8));
    const xLabels = data
      .filter((_, i) => i === 0 || i === data.length - 1 || i % step === 0)
      .map((d, _, arr) => ({
        label: formatDateLabel(d.date),
        x: xScale(data.indexOf(d)),
        i: data.indexOf(d),
      }));

    // Y labels: 5 ticks
    const yLabels = [0, 0.25, 0.5, 0.75, 1].map((frac) => ({
      value: Math.round(yMax * frac),
      y: yScale(yMax * frac),
    }));

    return { viewsPath, engagementPath, yMax, xLabels, yLabels };
  }, [data]);

  if (loading) return <Skeleton variant="rounded" height={280} />;

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip
            size="small"
            sx={{ backgroundColor: "#1565c0", color: "#fff", fontWeight: 500 }}
            label="Views"
          />
          <Chip
            size="small"
            sx={{ backgroundColor: "#7b1fa2", color: "#fff", fontWeight: 500 }}
            label="Engagement"
          />
        </Stack>
      </Stack>

      {!data || data.length < 2 ? (
        <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
          <Typography variant="body2">No time series data available for the selected period.</Typography>
        </Box>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <svg
            width="100%"
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT + 10}`}
            style={{ display: "block" }}
            aria-label="Views and engagement line chart"
          >
            {/* Grid lines */}
            {yLabels.map(({ value, y }) => (
              <g key={value}>
                <line
                  x1={PADDING.left}
                  x2={CHART_WIDTH - PADDING.right}
                  y1={y}
                  y2={y}
                  stroke="#e0e0e0"
                  strokeDasharray="4 4"
                />
                <text x={PADDING.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#757575">
                  {formatYLabel(value)}
                </text>
              </g>
            ))}

            {/* X labels */}
            {xLabels.map(({ label, x }) => (
              <text
                key={label + x}
                x={x}
                y={CHART_HEIGHT - 5}
                textAnchor="middle"
                fontSize={11}
                fill="#757575"
              >
                {label}
              </text>
            ))}

            {/* Engagement area fill */}
            <path
              d={`${engagementPath} L ${CHART_WIDTH - PADDING.right} ${CHART_HEIGHT - PADDING.bottom} L ${PADDING.left} ${CHART_HEIGHT - PADDING.bottom} Z`}
              fill="#7b1fa2"
              fillOpacity={0.08}
            />

            {/* Views area fill */}
            <path
              d={`${viewsPath} L ${CHART_WIDTH - PADDING.right} ${CHART_HEIGHT - PADDING.bottom} L ${PADDING.left} ${CHART_HEIGHT - PADDING.bottom} Z`}
              fill="#1565c0"
              fillOpacity={0.08}
            />

            {/* Engagement line */}
            <path
              d={engagementPath}
              fill="none"
              stroke="#7b1fa2"
              strokeWidth={2}
              strokeLinejoin="round"
            />

            {/* Views line */}
            <path
              d={viewsPath}
              fill="none"
              stroke="#1565c0"
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
          </svg>
        </Box>
      )}
    </Paper>
  );
};

export default TimeSeriesChart;
