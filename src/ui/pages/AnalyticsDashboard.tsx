/**
 * AnalyticsDashboard Page - Video performance analytics and insights
 */

import React from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import BarChartIcon from "@mui/icons-material/BarChart";
import { useAnalytics } from "../hooks/useAnalytics";
import { KPICards } from "../components/analytics/KPICards";
import { DateRangePicker } from "../components/analytics/DateRangePicker";
import { TimeSeriesChart } from "../components/analytics/TimeSeriesChart";
import { EngagementBreakdown } from "../components/analytics/EngagementBreakdown";
import { TopVideosTable } from "../components/analytics/TopVideosTable";
import { PlatformComparison } from "../components/analytics/PlatformComparison";
import { TrendAnalysis } from "../components/analytics/TrendAnalysis";
import { ContentHeatmap } from "../components/analytics/ContentHeatmap";

const AnalyticsDashboard: React.FC = () => {
  const {
    data,
    loading,
    error,
    dateRange,
    customStart,
    customEnd,
    setDateRange,
    setCustomStart,
    setCustomEnd,
    refresh,
    exportCSV,
  } = useAnalytics();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <BarChartIcon sx={{ fontSize: 32, color: "primary.main" }} />
            <Typography variant="h4" fontWeight={700}>
              Analytics Dashboard
            </Typography>
          </Stack>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            Monitor video performance, engagement, and platform-level insights.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Export data as CSV">
            <span>
              <Button
                startIcon={<DownloadIcon />}
                variant="outlined"
                onClick={exportCSV}
                disabled={!data || loading}
                size="small"
              >
                Export CSV
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Refresh analytics data">
            <IconButton onClick={refresh} disabled={loading} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Date Range Picker */}
      <Box sx={{ mb: 3, p: 2, backgroundColor: "#fafafa", borderRadius: 2, border: "1px solid #e0e0e0" }}>
        <DateRangePicker
          value={dateRange}
          customStart={customStart}
          customEnd={customEnd}
          onChange={setDateRange}
          onCustomStartChange={setCustomStart}
          onCustomEndChange={setCustomEnd}
        />
      </Box>

      {/* Error State */}
      {error && !loading && (
        <Alert severity="warning" sx={{ mb: 3 }} action={
          <Button size="small" onClick={refresh}>Retry</Button>
        }>
          {error} — Showing empty state.
        </Alert>
      )}

      {/* Loading overlay indicator */}
      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3, color: "text.secondary" }}>
          <CircularProgress size={16} />
          <Typography variant="body2">Loading analytics data...</Typography>
        </Box>
      )}

      {/* KPI Cards */}
      <Box sx={{ mb: 4 }}>
        <KPICards kpis={data?.kpis || null} loading={loading} />
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Time Series Chart */}
      <Box sx={{ mb: 4 }}>
        <TimeSeriesChart data={data?.timeSeries || []} loading={loading} />
      </Box>

      {/* Engagement Breakdown + Platform Comparison */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <EngagementBreakdown
            data={data?.platformMetrics || []}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <PlatformComparison
            data={data?.platformMetrics || []}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Trend Analysis + Content Heatmap */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={5}>
          <TrendAnalysis
            timeSeries={data?.timeSeries || []}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} md={7}>
          <ContentHeatmap
            data={data?.heatmapData || []}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Top Videos Table */}
      <Box sx={{ mb: 4 }}>
        <TopVideosTable videos={data?.topVideos || []} loading={loading} />
      </Box>

      {/* Footer note */}
      <Box sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 1, textAlign: "center" }}>
        <Typography variant="caption" color="textSecondary">
          📊 Analytics data is fetched from the marketing analytics API. Data may be delayed by up to 1 hour.
          {" "}Use <strong>Export CSV</strong> to download raw data for offline analysis.
        </Typography>
      </Box>
    </Container>
  );
};

export default AnalyticsDashboard;
