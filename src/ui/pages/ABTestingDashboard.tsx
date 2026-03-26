/**
 * ABTestingDashboard – Phase F4
 * Create and monitor A/B tests for video titles and thumbnails.
 */

import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  MenuItem,
  TextField,
  Paper,
  Tabs,
  Tab,
  Alert,
  Chip,
  Divider,
  CircularProgress,
  Tooltip,
  IconButton,
} from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ListAltIcon from "@mui/icons-material/ListAlt";
import BarChartIcon from "@mui/icons-material/BarChart";
import HistoryIcon from "@mui/icons-material/History";
import { useABTestResults } from "../hooks/useABTestResults";
import { VariantCreationForm } from "../components/ab-testing/VariantCreationForm";
import { ActiveTestsList } from "../components/ab-testing/ActiveTestsList";
import { ResultsView } from "../components/ab-testing/ResultsView";
import { HistoricalTests } from "../components/ab-testing/HistoricalTests";

// ─── Tab Panel Helper ─────────────────────────────────────────────────────────

interface TabPanelProps {
  value: number;
  index: number;
  children: React.ReactNode;
}

const TabPanel: React.FC<TabPanelProps> = ({ value, index, children }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ pt: 2 }}>
    {value === index && children}
  </Box>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const ABTestingDashboard: React.FC = () => {
  const {
    videos,
    selectedVideoId,
    variants,
    loadingVideos,
    loadingVariants,
    error,
    setSelectedVideoId,
    refresh,
  } = useABTestResults();

  const [tab, setTab] = useState(0);

  const handleVideoChange = (id: string) => {
    setSelectedVideoId(id);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ScienceIcon sx={{ fontSize: 32, color: "primary.main" }} />
            <Typography variant="h4" fontWeight={700}>
              A/B Testing Manager
            </Typography>
          </Stack>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            Create and monitor A/B tests for video titles and thumbnails. Find your winning variant.
          </Typography>
        </Box>
        <Tooltip title="Refresh data">
          <IconButton onClick={refresh} disabled={loadingVideos || loadingVariants} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Error */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Video Selector */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ minWidth: 120 }}>
            Target Video:
          </Typography>
          {loadingVideos ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">Loading videos…</Typography>
            </Stack>
          ) : (
            <TextField
              select
              size="small"
              value={selectedVideoId}
              onChange={(e) => handleVideoChange(e.target.value)}
              sx={{ minWidth: 340 }}
              label="Select video to test"
              helperText={selectedVideoId ? `${variants.length} variant(s) for this video` : "Pick a video to manage its A/B tests"}
            >
              {videos.length === 0 && (
                <MenuItem value="" disabled>No videos available — create a video first</MenuItem>
              )}
              {videos.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                      {v.id.slice(0, 20)}…
                    </Typography>
                    {v.status && (
                      <Chip
                        label={v.status}
                        size="small"
                        color={
                          v.status === "ready" ? "success" :
                          v.status === "failed" ? "error" :
                          "default"
                        }
                      />
                    )}
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
          )}

          {selectedVideoId && variants.length > 0 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Divider orientation="vertical" flexItem />
              <Chip
                label={`${variants.length} variant${variants.length !== 1 ? "s" : ""}`}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip
                label={`${variants.reduce((s, v) => s + v.assignedCount, 0).toLocaleString()} total assignments`}
                size="small"
                variant="outlined"
              />
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* Tabs */}
      <Paper variant="outlined" sx={{ p: 0 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
        >
          <Tab
            icon={<AddCircleOutlineIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Create Test"
          />
          <Tab
            icon={<ListAltIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={`Active Tests${variants.length > 0 ? ` (${variants.length})` : ""}`}
          />
          <Tab
            icon={<BarChartIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Results"
          />
          <Tab
            icon={<HistoryIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="History"
          />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <TabPanel value={tab} index={0}>
            <VariantCreationForm
              videos={videos}
              selectedVideoId={selectedVideoId}
              onVideoChange={handleVideoChange}
              onSuccess={() => {
                refresh();
                setTab(1);
              }}
            />
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <ActiveTestsList
              variants={variants}
              selectedVideoId={selectedVideoId}
              loading={loadingVariants}
              onRefresh={refresh}
            />
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <ResultsView
              variants={variants}
              selectedVideoId={selectedVideoId}
              loading={loadingVariants}
            />
          </TabPanel>

          <TabPanel value={tab} index={3}>
            <HistoricalTests
              variants={variants}
              selectedVideoId={selectedVideoId}
              loading={loadingVariants}
            />
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
};

export default ABTestingDashboard;
