/**
 * ScheduleForm – form to enqueue a new render job
 */

import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  Stack,
  Typography,
  Divider,
  Alert,
  CircularProgress,
  Collapse,
  IconButton,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import SendIcon from "@mui/icons-material/Send";
import { CronBuilder } from "./CronBuilder";
import { useEnqueueJob, type EnqueueJobRequest } from "../../hooks/useSchedulerMutation";

const ORIENTATIONS = ["portrait", "landscape"] as const;
const VIDEO_TYPES = ["short", "long"] as const;
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
];
const CATEGORIES = [
  "World", "Technology", "Science", "Business", "Sports",
  "Entertainment", "Health", "Politics", "Finance", "Culture",
];

const DEFAULT_FORM: EnqueueJobRequest = {
  category: "Technology",
  orientation: "portrait",
  videoType: "short",
  subtitleLanguage: "en",
  sceneText: "",
  searchTerms: "",
};

interface ScheduleFormProps {
  onSuccess?: () => void;
}

export const ScheduleForm: React.FC<ScheduleFormProps> = ({ onSuccess }) => {
  const [form, setForm] = useState<EnqueueJobRequest>(DEFAULT_FORM);
  const [cronExpr, setCronExpr] = useState("0 * * * *");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { enqueue, loading, error, data } = useEnqueueJob();

  const handleChange = (field: keyof EnqueueJobRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await enqueue(form);
    if (result) {
      setForm(DEFAULT_FORM);
      onSuccess?.();
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        New Render Job
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            select
            size="small"
            label="Category"
            value={form.category}
            onChange={handleChange("category")}
            required
          >
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            select
            size="small"
            label="Orientation"
            value={form.orientation}
            onChange={handleChange("orientation")}
          >
            {ORIENTATIONS.map((o) => (
              <MenuItem key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            select
            size="small"
            label="Video Type"
            value={form.videoType}
            onChange={handleChange("videoType")}
          >
            {VIDEO_TYPES.map((t) => (
              <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            select
            size="small"
            label="Subtitle Language"
            value={form.subtitleLanguage}
            onChange={handleChange("subtitleLanguage")}
          >
            {LANGUAGES.map((l) => (
              <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={8}>
          <TextField
            fullWidth
            size="small"
            label="Scene description (optional)"
            value={form.sceneText}
            onChange={handleChange("sceneText")}
            placeholder="Describe the video content..."
            multiline
            minRows={2}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="Search terms (comma-separated)"
            value={form.searchTerms}
            onChange={handleChange("searchTerms")}
            placeholder="e.g. AI, machine learning, neural networks"
          />
        </Grid>
      </Grid>

      {/* Advanced: Schedule */}
      <Divider sx={{ my: 2 }} />
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Recurrence Schedule (for reference)
        </Typography>
        <Tooltip title="Shows how often the backend scheduler runs. This value is set in server config.">
          <IconButton size="small" onClick={() => setShowAdvanced((v) => !v)}>
            {showAdvanced ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Stack>
      <Collapse in={showAdvanced}>
        <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1, mb: 2 }}>
          <CronBuilder value={cronExpr} onChange={setCronExpr} />
        </Box>
      </Collapse>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      {data && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Job enqueued! ID: <strong>{data.renderJobId}</strong>
        </Alert>
      )}

      <Stack direction="row" justifyContent="flex-end">
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !form.category}
          startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
          size="small"
        >
          {loading ? "Enqueueing…" : "Enqueue Job"}
        </Button>
      </Stack>
    </Box>
  );
};

export default ScheduleForm;
