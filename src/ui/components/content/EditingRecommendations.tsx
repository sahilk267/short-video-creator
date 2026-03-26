import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import MovieFilterIcon from "@mui/icons-material/MovieFilter";
import { useEditingSuggestionsMutation } from "../../hooks/useContentSuggestions";

interface EditingRecommendationsProps {
  initialScript?: string;
}

const INTENSITIES: Array<"low" | "medium" | "high"> = ["low", "medium", "high"];
const STYLES = ["cinematic", "fast-paced", "minimalist", "colorful", "documentary", "vlog", "tutorial"];

const intensityColor = (v: string) => v === "high" ? "error" : v === "medium" ? "warning" : "success";

const EditingRecommendations: React.FC<EditingRecommendationsProps> = ({ initialScript = "" }) => {
  const [script, setScript] = useState(initialScript);
  const [intensity, setIntensity] = useState<"low" | "medium" | "high">("medium");
  const [style, setStyle] = useState("");

  const mutation = useEditingSuggestionsMutation();

  const handleGet = () => {
    mutation.mutate({ script: script || undefined, intensity, style: style || undefined });
  };

  const suggestions = mutation.data?.suggestions ?? [];

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <MovieFilterIcon color="primary" />
          <Typography variant="h6">Editing Recommendations</Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              size="small"
              label="Script / Content (optional)"
              multiline
              minRows={2}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Paste your script for context-aware recommendations…"
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Intensity</InputLabel>
              <Select
                value={intensity}
                label="Intensity"
                onChange={(e) => setIntensity(e.target.value as "low" | "medium" | "high")}
              >
                {INTENSITIES.map((v) => (
                  <MenuItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Style</InputLabel>
              <Select value={style} label="Style" onChange={(e) => setStyle(e.target.value)}>
                <MenuItem value="">Any</MenuItem>
                {STYLES.map((s) => (
                  <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Button
          variant="contained"
          startIcon={mutation.isLoading ? <CircularProgress size={16} color="inherit" /> : <MovieFilterIcon />}
          onClick={handleGet}
          disabled={mutation.isLoading}
        >
          Get Recommendations
        </Button>

        {mutation.error && (
          <Alert severity="error" sx={{ mt: 2 }}>{String(mutation.error)}</Alert>
        )}

        {suggestions.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""}
              {mutation.data?.intensity && (
                <Chip
                  label={mutation.data.intensity}
                  size="small"
                  color={intensityColor(mutation.data.intensity)}
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {suggestions.map((s, idx) => (
              <Box key={idx} sx={{ mb: 1.5, p: 1.5, borderRadius: 1, bgcolor: "action.hover" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Chip label={s.type} size="small" variant="outlined" />
                  {s.intensity && (
                    <Chip label={s.intensity} size="small" color={intensityColor(s.intensity)} />
                  )}
                </Box>
                <Typography variant="body2">{s.description}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default EditingRecommendations;
