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
import ImageSearchIcon from "@mui/icons-material/ImageSearch";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { useTrendOptimizeMutation } from "../../hooks/useContentSuggestions";

interface ThumbnailGeneratorProps {
  initialTitle?: string;
}

const PLATFORMS = ["youtube", "instagram", "tiktok", "facebook"];
const CATEGORIES = ["news", "entertainment", "education", "sports", "tech", "lifestyle"];

const ThumbnailGenerator: React.FC<ThumbnailGeneratorProps> = ({ initialTitle = "" }) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("entertainment");
  const [platform, setPlatform] = useState("youtube");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const trendMutation = useTrendOptimizeMutation();

  const handleGenerate = () => {
    trendMutation.mutate({ title, description: description || undefined, category, platform });
  };

  const handleCopyTag = (tag: string, idx: number) => {
    void navigator.clipboard.writeText(tag);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const tags = trendMutation.data?.tags ?? [];

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <ImageSearchIcon color="primary" />
          <Typography variant="h6">Thumbnail Tag Generator</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Generate trending tags optimised for your thumbnail title and platform to maximise discoverability.
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Thumbnail Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 5 Amazing Travel Hacks"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Platform</InputLabel>
              <Select value={platform} label="Platform" onChange={(e) => setPlatform(e.target.value)}>
                {PLATFORMS.map((p) => (
                  <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Button
          variant="contained"
          startIcon={
            trendMutation.isLoading
              ? <CircularProgress size={16} color="inherit" />
              : <LocalOfferIcon />
          }
          onClick={handleGenerate}
          disabled={trendMutation.isLoading || !title.trim()}
        >
          Generate Tags
        </Button>

        {trendMutation.error && (
          <Alert severity="error" sx={{ mt: 2 }}>{String(trendMutation.error)}</Alert>
        )}

        {tags.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              {tags.length} trending tag{tags.length !== 1 ? "s" : ""}
              {trendMutation.data?.platform && (
                <Chip label={trendMutation.data.platform} size="small" sx={{ ml: 1 }} />
              )}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {tags.map((t, idx) => (
                <Chip
                  key={idx}
                  label={
                    t.score != null
                      ? `${t.tag} (${t.score})`
                      : t.tag
                  }
                  size="small"
                  color={copiedIdx === idx ? "success" : t.score != null && t.score >= 7 ? "primary" : "default"}
                  onClick={() => handleCopyTag(t.tag, idx)}
                  clickable
                  title="Click to copy"
                />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              Click a tag to copy it to clipboard.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ThumbnailGenerator;
