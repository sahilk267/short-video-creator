import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material";
import apiClient from "../services/apiClient";

const orientations = ["portrait", "landscape"];
const http = apiClient.getAxiosInstance();

const BulkQueue: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [queueStates, setQueueStates] = useState<Record<string, number>>({});

  const [category, setCategory] = useState("World");
  const [orientation, setOrientation] = useState("portrait");
  const [language, setLanguage] = useState("en");

  const loadStates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await http.get("/api/health/queue/states");
      setQueueStates(res.data.renderStates || {});
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load queue states");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStates();
  }, []);

  const enqueue = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        sceneInput: [
          {
            text: `Auto queued item for ${category}`,
            searchTerms: [category, "news"],
            language,
          },
        ],
        orientation,
        category,
        videoType: "short",
        subtitleLanguage: language,
      };
      const res = await http.post("/api/queue/bulk", payload);
      setSuccess(`Queued render job: ${res.data.renderJobId}`);
      await loadStates();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to enqueue render job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box maxWidth="md" mx="auto" py={4}>
      <Typography variant="h4" gutterBottom>
        Bulk Queue Manager
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Orientation"
              value={orientation}
              onChange={(e) => setOrientation(e.target.value)}
            >
              {orientations.map((o) => (
                <MenuItem key={o} value={o}>{o}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" onClick={enqueue} disabled={submitting}>
              {submitting ? "Queueing..." : "Queue Render Job"}
            </Button>
            <Button sx={{ ml: 2 }} onClick={loadStates} disabled={loading}>
              Refresh States
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Render Queue States</Typography>
        {loading ? <CircularProgress size={20} /> : (
          <Box>
            {Object.keys(queueStates).length === 0 ? (
              <Typography color="text.secondary">No queue state data yet.</Typography>
            ) : Object.entries(queueStates).map(([status, count]) => (
              <Typography key={status}>{status}: {count}</Typography>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default BulkQueue;
