/**
 * TrendAnalysis Component - Period-over-period trend indicators and sparklines
 */

import React, { useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  Divider,
  Skeleton,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import { TimeSeriesPoint } from "../../hooks/useAnalytics";

interface TrendAnalysisProps {
  timeSeries: TimeSeriesPoint[];
  loading?: boolean;
}

function splitHalves(data: TimeSeriesPoint[]) {
  const mid = Math.floor(data.length / 2);
  return { prev: data.slice(0, mid), curr: data.slice(mid) };
}

function sum(arr: TimeSeriesPoint[], key: keyof TimeSeriesPoint): number {
  return arr.reduce((s, d) => s + ((d[key] as number) || 0), 0);
}

function calcChange(prev: number, curr: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

interface SparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

const Sparkline: React.FC<SparklineProps> = ({ data, color, width = 100, height = 30 }) => {
  const path = useMemo(() => {
    if (data.length < 2) return "";
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const xStep = width / (data.length - 1);
    return data
      .map((v, i) => {
        const x = (i * xStep).toFixed(1);
        const y = (height - ((v - min) / range) * height).toFixed(1);
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  }, [data, width, height]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {path && (
        <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      )}
    </svg>
  );
};

interface TrendRowProps {
  label: string;
  prevVal: number;
  currVal: number;
  change: number;
  sparkData: number[];
  color: string;
  formatFn?: (n: number) => string;
}

function TrendRow({ label, currVal, change, sparkData, color, formatFn }: TrendRowProps) {
  const fmt = formatFn || ((n) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toLocaleString());
  const Icon = change > 2 ? TrendingUpIcon : change < -2 ? TrendingDownIcon : TrendingFlatIcon;
  const chipColor = change > 2 ? "#e8f5e9" : change < -2 ? "#ffebee" : "#f5f5f5";
  const textColor = change > 2 ? "#2e7d32" : change < -2 ? "#c62828" : "#757575";

  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Box sx={{ minWidth: 110 }}>
        <Typography variant="caption" color="textSecondary">{label}</Typography>
        <Typography variant="h6" fontWeight={700}>{fmt(currVal)}</Typography>
      </Box>
      <Sparkline data={sparkData} color={color} />
      <Chip
        size="small"
        icon={<Icon sx={{ fontSize: "1rem !important" }} />}
        label={`${change >= 0 ? "+" : ""}${change}%`}
        sx={{
          backgroundColor: chipColor,
          color: textColor,
          fontWeight: 600,
          "& .MuiChip-icon": { color: "inherit" },
        }}
      />
    </Stack>
  );
}

export const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ timeSeries, loading = false }) => {
  if (loading) return <Skeleton variant="rounded" height={280} />;

  const { prev, curr } = splitHalves(timeSeries || []);

  const metrics = [
    {
      label: "Views",
      prevVal: sum(prev, "views"),
      currVal: sum(curr, "views"),
      sparkData: timeSeries.map((d) => d.views || 0),
      color: "#1565c0",
    },
    {
      label: "Engagement",
      prevVal: sum(prev, "engagement"),
      currVal: sum(curr, "engagement"),
      sparkData: timeSeries.map((d) => d.engagement || 0),
      color: "#7b1fa2",
    },
    {
      label: "Likes",
      prevVal: sum(prev, "likes"),
      currVal: sum(curr, "likes"),
      sparkData: timeSeries.map((d) => d.likes || 0),
      color: "#4caf50",
    },
    {
      label: "Shares",
      prevVal: sum(prev, "shares"),
      currVal: sum(curr, "shares"),
      sparkData: timeSeries.map((d) => d.shares || 0),
      color: "#2196f3",
    },
  ];

  return (
    <Paper sx={{ p: 3, height: "100%" }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Trend Analysis
      </Typography>
      <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 2 }}>
        Comparing first half vs second half of selected period
      </Typography>

      {timeSeries.length < 4 ? (
        <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
          <Typography variant="body2">Not enough data for trend analysis. Select a wider date range.</Typography>
        </Box>
      ) : (
        <Stack spacing={2} divider={<Divider flexItem />}>
          {metrics.map((m) => (
            <TrendRow
              key={m.label}
              label={m.label}
              prevVal={m.prevVal}
              currVal={m.currVal}
              change={calcChange(m.prevVal, m.currVal)}
              sparkData={m.sparkData}
              color={m.color}
            />
          ))}
        </Stack>
      )}
    </Paper>
  );
};

export default TrendAnalysis;
