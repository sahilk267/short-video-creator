import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import { useIdeationMutation, type IdeaItem } from "../../hooks/useContentSuggestions";

const CATEGORIES = ["news", "entertainment", "education", "sports", "tech", "lifestyle", "travel", "food"];
const PLATFORMS = ["youtube", "instagram", "tiktok", "facebook", "telegram"];

interface IdeationPanelProps {
  onSelectIdea?: (idea: IdeaItem) => void;
}

const IdeationPanel: React.FC<IdeationPanelProps> = ({ onSelectIdea }) => {
  const [category, setCategory] = useState("news");
  const [platform, setPlatform] = useState("youtube");
  const [count, setCount] = useState(5);
  const [style, setStyle] = useState("");

  const mutation = useIdeationMutation();

  const handleGenerate = () => {
    mutation.mutate({ category, platform, count, style: style || undefined });
  };

  const ideas = mutation.data?.ideas ?? [];

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <LightbulbIcon color="primary" />
          <Typography variant="h6">Content Ideation</Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Platform</InputLabel>
              <Select value={platform} label="Platform" onChange={(e) => setPlatform(e.target.value)}>
                {PLATFORMS.map((p) => (
                  <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              size="small"
              label="Count"
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value))))}
              inputProps={{ min: 1, max: 20 }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              size="small"
              label="Style (optional)"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="e.g. funny, serious"
            />
          </Grid>
        </Grid>

        <Button
          variant="contained"
          startIcon={mutation.isLoading ? <CircularProgress size={16} color="inherit" /> : <LightbulbIcon />}
          onClick={handleGenerate}
          disabled={mutation.isLoading}
        >
          Generate Ideas
        </Button>

        {mutation.error && (
          <Alert severity="error" sx={{ mt: 2 }}>{String(mutation.error)}</Alert>
        )}

        {ideas.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              {ideas.length} idea{ideas.length !== 1 ? "s" : ""} generated
            </Typography>
            <Grid container spacing={1.5}>
              {ideas.map((idea, idx) => (
                <Grid item xs={12} key={idx}>
                  <Card variant="outlined" sx={{ cursor: onSelectIdea ? "pointer" : "default" }}
                    onClick={() => onSelectIdea?.(idea)}>
                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" fontWeight={600}>{idea.title}</Typography>
                          {idea.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {idea.description}
                            </Typography>
                          )}
                          {idea.tags && idea.tags.length > 0 && (
                            <Box sx={{ mt: 1, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                              {idea.tags.map((tag) => (
                                <Chip key={tag} label={tag} size="small" />
                              ))}
                            </Box>
                          )}
                        </Box>
                        {idea.trendScore != null && (
                          <Chip
                            label={`Trend ${idea.trendScore}`}
                            size="small"
                            color={idea.trendScore >= 7 ? "success" : idea.trendScore >= 4 ? "warning" : "default"}
                            sx={{ ml: 1, flexShrink: 0 }}
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default IdeationPanel;
