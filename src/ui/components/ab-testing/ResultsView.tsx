/**
 * ResultsView – visual A/B test results comparison with winner highlight
 */

import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VisibilityIcon from "@mui/icons-material/Visibility";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import type { ABVariant } from "../../hooks/useABTestResults";
import { computeCTR, findWinner } from "../../hooks/useABTestResults";

interface ResultsViewProps {
  variants: ABVariant[];
  selectedVideoId: string;
  loading: boolean;
}

/** Simple SVG horizontal bar — no external chart library */
const BarChart: React.FC<{ label: string; value: number; max: number; color: string; isWinner: boolean }> = ({
  label,
  value,
  max,
  color,
  isWinner,
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          {isWinner && <EmojiEventsIcon sx={{ fontSize: 14, color: "success.main" }} />}
          <Typography variant="body2" fontWeight={isWinner ? 700 : 400}>
            {label}
          </Typography>
        </Stack>
        <Typography variant="body2" fontWeight={700} sx={{ color }}>
          {typeof value === "number" && value % 1 !== 0 ? `${value.toFixed(2)}%` : value.toLocaleString()}
        </Typography>
      </Stack>
      <Box
        sx={{
          height: 12,
          bgcolor: "grey.100",
          borderRadius: 6,
          overflow: "hidden",
          border: isWinner ? `1.5px solid` : "1.5px solid transparent",
          borderColor: isWinner ? "success.main" : "transparent",
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${percentage}%`,
            bgcolor: color,
            borderRadius: 6,
            transition: "width 0.6s ease",
          }}
        />
      </Box>
    </Box>
  );
};

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  highlight?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ icon, label, value, sublabel, highlight }) => (
  <Card
    variant="outlined"
    sx={{
      height: "100%",
      border: highlight ? "2px solid" : undefined,
      borderColor: highlight ? "success.main" : undefined,
    }}
  >
    <CardContent sx={{ py: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        {icon}
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </Stack>
      <Typography variant="h5" fontWeight={700}>{value}</Typography>
      {sublabel && <Typography variant="caption" color="text.secondary">{sublabel}</Typography>}
    </CardContent>
  </Card>
);

const VARIANT_COLORS = ["#1976d2", "#9c27b0", "#ed6c02", "#2e7d32", "#d32f2f"];

export const ResultsView: React.FC<ResultsViewProps> = ({
  variants,
  selectedVideoId,
  loading,
}) => {
  const winnerId = findWinner(variants);

  const enriched = useMemo(() => {
    return variants.map((v, i) => ({
      ...v,
      ctr: computeCTR(v),
      color: VARIANT_COLORS[i % VARIANT_COLORS.length],
      isWinner: v.id === winnerId,
    }));
  }, [variants, winnerId]);

  const winner = enriched.find((v) => v.isWinner);

  const maxAssigned = Math.max(...enriched.map((v) => v.assignedCount), 1);
  const maxClicks = Math.max(...enriched.map((v) => v.clicks), 1);
  const maxCTR = Math.max(...enriched.map((v) => v.ctr), 0.01);

  const totalAssigned = enriched.reduce((s, v) => s + v.assignedCount, 0);
  const avgCTR = enriched.length > 0 ? enriched.reduce((s, v) => s + v.ctr, 0) / enriched.length : 0;

  if (!selectedVideoId) {
    return <Alert severity="info">Select a video to view test results.</Alert>;
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (variants.length === 0) {
    return (
      <Alert severity="info">
        No variants found for this video. Create variants first to see results.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Summary KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <KPICard
            icon={<TouchAppIcon sx={{ fontSize: 18, color: "primary.main" }} />}
            label="Total Assignments"
            value={totalAssigned.toLocaleString()}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard
            icon={<VisibilityIcon sx={{ fontSize: 18, color: "secondary.main" }} />}
            label="Variants Tested"
            value={String(enriched.length)}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard
            icon={<TrendingUpIcon sx={{ fontSize: 18, color: "warning.main" }} />}
            label="Avg CTR"
            value={`${avgCTR.toFixed(2)}%`}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPICard
            icon={<EmojiEventsIcon sx={{ fontSize: 18, color: "success.main" }} />}
            label="Winner"
            value={winner?.variantKey ?? "—"}
            sublabel={winner ? `CTR: ${winner.ctr.toFixed(2)}%` : undefined}
            highlight={!!winner}
          />
        </Grid>
      </Grid>

      {winner && (
        <Alert
          icon={<EmojiEventsIcon />}
          severity="success"
          sx={{ mb: 2 }}
        >
          <strong>Recommended winner: "{winner.title}"</strong> (variant: {winner.variantKey}) —{" "}
          {winner.ctr.toFixed(2)}% CTR with {winner.assignedCount.toLocaleString()} assignments.
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* Assignments chart */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <TouchAppIcon sx={{ fontSize: 18, color: "primary.main" }} />
              <Typography variant="subtitle2" fontWeight={600}>Assignments</Typography>
            </Stack>
            {enriched.map((v) => (
              <BarChart
                key={v.id}
                label={v.variantKey}
                value={v.assignedCount}
                max={maxAssigned}
                color={v.color}
                isWinner={v.isWinner}
              />
            ))}
          </Card>
        </Grid>

        {/* Clicks chart */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <VisibilityIcon sx={{ fontSize: 18, color: "secondary.main" }} />
              <Typography variant="subtitle2" fontWeight={600}>Clicks</Typography>
            </Stack>
            {enriched.map((v) => (
              <BarChart
                key={v.id}
                label={v.variantKey}
                value={v.clicks}
                max={maxClicks}
                color={v.color}
                isWinner={v.isWinner}
              />
            ))}
          </Card>
        </Grid>

        {/* CTR chart */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <TrendingUpIcon sx={{ fontSize: 18, color: "warning.main" }} />
              <Typography variant="subtitle2" fontWeight={600}>Click-Through Rate (%)</Typography>
            </Stack>
            {enriched.map((v) => (
              <BarChart
                key={v.id}
                label={v.variantKey}
                value={v.ctr}
                max={maxCTR}
                color={v.color}
                isWinner={v.isWinner}
              />
            ))}
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Variant legend */}
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {enriched.map((v) => (
          <Tooltip key={v.id} title={v.title}>
            <Chip
              label={v.variantKey}
              size="small"
              icon={v.isWinner ? <EmojiEventsIcon sx={{ fontSize: 14 }} /> : undefined}
              sx={{ bgcolor: v.color, color: "white", fontWeight: v.isWinner ? 700 : 400 }}
            />
          </Tooltip>
        ))}
      </Stack>
    </Box>
  );
};

export default ResultsView;
