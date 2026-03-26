import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import PsychologyAltIcon from "@mui/icons-material/PsychologyAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useAIMetrics, type SuggestionContext } from "../hooks/useAIMetrics";
import { useAITraining } from "../hooks/useAITraining";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { ModelHealthCard } from "../components/ai/ModelHealthCard";
import { TrainingJobsList } from "../components/ai/TrainingJobsList";
import { TrainingHistory } from "../components/ai/TrainingHistory";
import { PredictionsList } from "../components/ai/PredictionsList";
import { RecommendationsPanel } from "../components/ai/RecommendationsPanel";
import { ModelComparison } from "../components/ai/ModelComparison";
import EmptyState from "../components/shared/EmptyState";

const defaultSuggestionContext: SuggestionContext = {
  category: "World",
  platform: "youtube",
  avgDurationSec: 45,
  recentFailures: 0,
  recentEngagementRate: 0.2,
};

const AIDashboard: React.FC = () => {
  const { data, latestFailure, loading, error, refresh } = useAIMetrics({ autoLoad: false });
  const { autoRefreshEnabled, lastUpdatedAt, setAutoRefreshEnabled, refreshNow } = useAutoRefresh(refresh, {
    intervalMs: 30000,
  });
  const { training, suggesting, trainingError, suggestionError, suggestion, triggerTraining, requestSuggestion } = useAITraining(refreshNow);
  const [context, setContext] = useState<SuggestionContext>(defaultSuggestionContext);

  const handleContextChange = <K extends keyof SuggestionContext>(key: K, value: SuggestionContext[K]) => {
    setContext((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <PsychologyAltIcon sx={{ fontSize: 34, color: "primary.main" }} />
            <Typography variant="h4" fontWeight={700}>
              AI Monitoring Dashboard
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Monitor model health, review recent outcomes, retrain on demand, and test live AI recommendations.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {lastUpdatedAt ? `Last updated ${new Date(lastUpdatedAt).toLocaleTimeString()}` : "Waiting for first snapshot"}
          </Typography>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={autoRefreshEnabled}
                onChange={(_, checked) => setAutoRefreshEnabled(checked)}
              />
            }
            label="Auto-refresh"
            sx={{ mr: 0 }}
          />
          {data && (
            <Chip
              label={data.health.fallbackMode ? "Fallback mode" : "Primary model active"}
              color={data.health.fallbackMode ? "warning" : "success"}
              variant="outlined"
            />
          )}
          <Tooltip title="Refresh AI metrics">
            <IconButton onClick={() => void refreshNow()} disabled={loading || training} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {(error || trainingError || suggestionError) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {[error, trainingError, suggestionError].filter(Boolean).join(" · ")}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">Loading AI dashboard...</Typography>
        </Box>
      )}

      {!loading && !data && !error && (
        <EmptyState
          title="No AI telemetry yet"
          description="This dashboard fills in after AI events, health snapshots, or model metadata become available."
          actionLabel="Refresh AI dashboard"
          onAction={() => void refreshNow()}
        />
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={7}>
          <ModelHealthCard data={data} loading={loading} />
        </Grid>
        <Grid item xs={12} lg={5}>
          <TrainingJobsList data={data} loading={loading} training={training} onTrain={triggerTraining} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <TrainingHistory data={data?.trainingHistory ?? []} loading={loading} />
        </Grid>
        <Grid item xs={12} lg={4}>
          <RecommendationsPanel recommendations={data?.recommendations ?? []} latestSuggestion={suggestion} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <ModelComparison metrics={data?.comparison ?? []} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AutoGraphIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>Suggestion sandbox</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Send a live context to the AI suggestion endpoint and compare the recommendation with current model health.
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Category"
                    fullWidth
                    size="small"
                    value={context.category ?? ""}
                    onChange={(event) => handleContextChange("category", event.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Platform"
                    fullWidth
                    size="small"
                    value={context.platform ?? ""}
                    onChange={(event) => handleContextChange("platform", event.target.value)}
                  >
                    {[
                      "youtube",
                      "instagram",
                      "facebook",
                      "telegram",
                    ].map((platform) => (
                      <MenuItem key={platform} value={platform}>{platform}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Avg duration (sec)"
                    type="number"
                    fullWidth
                    size="small"
                    value={context.avgDurationSec ?? 0}
                    onChange={(event) => handleContextChange("avgDurationSec", Number(event.target.value))}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Recent failures"
                    type="number"
                    fullWidth
                    size="small"
                    value={context.recentFailures ?? 0}
                    onChange={(event) => handleContextChange("recentFailures", Number(event.target.value))}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Engagement rate"
                    type="number"
                    fullWidth
                    size="small"
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                    value={context.recentEngagementRate ?? 0}
                    onChange={(event) => handleContextChange("recentEngagementRate", Number(event.target.value))}
                  />
                </Grid>
              </Grid>

              <Button variant="contained" onClick={() => void requestSuggestion(context)} disabled={suggesting || loading}>
                {suggesting ? "Generating..." : "Generate suggestion"}
              </Button>

              {suggestion && (
                <Alert severity={suggestion.suggestion.fallbackUsed ? "warning" : "success"}>
                  Recommendation: {suggestion.suggestion.recommendation} Score {suggestion.suggestion.score}, confidence {Math.round(suggestion.suggestion.confidence * 100)}%.
                </Alert>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <PredictionsList predictions={data?.predictions ?? []} loading={loading} />
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <WarningAmberIcon color="warning" />
                <Typography variant="h6" fontWeight={700}>Anomalies and failures</Typography>
              </Stack>

              {(data?.alerts ?? []).map((alert) => (
                <Alert key={alert.id} severity={alert.severity}>{alert.title}: {alert.description}</Alert>
              ))}

              {latestFailure ? (
                <Paper sx={{ p: 2, backgroundColor: "grey.50" }}>
                  <Typography variant="subtitle2" fontWeight={700}>Latest failure</Typography>
                  <Typography variant="body2">{latestFailure.phase} failed at {new Date(latestFailure.createdAt).toLocaleString()}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Job {latestFailure.jobId} · {Math.round(latestFailure.latencyMs / 1000)}s · {latestFailure.errorCode ?? "no error code recorded"}
                  </Typography>
                </Paper>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No recent failures recorded.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {!loading && data && data.metrics.totalEvents === 0 && (
        <EmptyState
          title="No AI events recorded yet"
          description="Record training or inference events to populate prediction history, recommendations, and failure analytics."
        />
      )}
    </Container>
  );
};

export default AIDashboard;
