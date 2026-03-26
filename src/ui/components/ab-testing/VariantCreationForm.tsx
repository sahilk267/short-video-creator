/**
 * VariantCreationForm – create a new A/B test variant for a video
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
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { useCreateVariant } from "../../hooks/useABTestMutation";
import type { VideoEntry } from "../../hooks/useABTestResults";

const VARIANT_KEYS = ["control", "variant-a", "variant-b", "variant-c"];

interface VariantCreationFormProps {
  videos: VideoEntry[];
  selectedVideoId: string;
  onVideoChange: (id: string) => void;
  onSuccess?: () => void;
}

interface FormState {
  variantKey: string;
  title: string;
  thumbnail: string;
}

const DEFAULT_FORM: FormState = {
  variantKey: "variant-a",
  title: "",
  thumbnail: "",
};

export const VariantCreationForm: React.FC<VariantCreationFormProps> = ({
  videos,
  selectedVideoId,
  onVideoChange,
  onSuccess,
}) => {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const { createVariant, loading, error, data, reset } = useCreateVariant();

  const handleChange = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideoId || !form.title.trim()) return;

    const result = await createVariant({
      videoId: selectedVideoId,
      variantKey: form.variantKey,
      title: form.title.trim(),
      thumbnail: form.thumbnail.trim() || undefined,
    });

    if (result) {
      setForm(DEFAULT_FORM);
      onSuccess?.();
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <AutoFixHighIcon sx={{ color: "primary.main" }} />
        <Typography variant="subtitle1" fontWeight={600}>
          Create New A/B Test Variant
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        {/* Video selection */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            size="small"
            label="Target Video"
            value={selectedVideoId}
            onChange={(e) => {
              onVideoChange(e.target.value);
              reset();
            }}
            required
            helperText="Select the video to test variants on"
          >
            {videos.length === 0 && (
              <MenuItem value="" disabled>No videos available</MenuItem>
            )}
            {videos.map((v) => (
              <MenuItem key={v.id} value={v.id}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {v.id.slice(0, 14)}…
                  </Typography>
                  {v.status && (
                    <Chip
                      label={v.status}
                      size="small"
                      color={v.status === "ready" ? "success" : v.status === "failed" ? "error" : "default"}
                    />
                  )}
                </Stack>
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Variant key */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            select
            size="small"
            label="Variant Key"
            value={form.variantKey}
            onChange={handleChange("variantKey")}
            required
            helperText="Identifier for this variant (control = baseline)"
          >
            {VARIANT_KEYS.map((k) => (
              <MenuItem key={k} value={k}>{k}</MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Title */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="Variant Title"
            value={form.title}
            onChange={handleChange("title")}
            required
            placeholder="e.g. 'Learn AI in 60 Seconds 🤖' or 'AI Tutorial for Beginners'"
            helperText="The title to test — keep it concise and compelling"
            inputProps={{ maxLength: 100 }}
          />
        </Grid>

        {/* Thumbnail URL (optional) */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="Thumbnail URL (optional)"
            value={form.thumbnail}
            onChange={handleChange("thumbnail")}
            placeholder="https://..."
            helperText="Link to a thumbnail image for this variant"
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      {data && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Variant <strong>{data.variantKey}</strong> created! ID: {data.id.slice(0, 12)}…
        </Alert>
      )}

      <Stack direction="row" justifyContent="flex-end">
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !selectedVideoId || !form.title.trim()}
          startIcon={loading ? <CircularProgress size={16} /> : <AddIcon />}
          size="small"
        >
          {loading ? "Creating…" : "Create Variant"}
        </Button>
      </Stack>
    </Box>
  );
};

export default VariantCreationForm;
