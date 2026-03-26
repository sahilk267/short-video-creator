import React from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";

export interface NewsSourceOption {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
}

interface AutoScriptPanelProps {
  autoLoading: boolean;
  selectedCategory: string;
  selectedSource: string;
  sources: NewsSourceOption[];
  onCategoryChange: (category: string) => void;
  onSourceChange: (sourceId: string) => void;
  onGenerate: () => void;
}

const categoryOptions = [
  { id: "General", label: "General" },
  { id: "World", label: "World" },
  { id: "Technology", label: "Tech" },
  { id: "Business", label: "Business" },
  { id: "Cricket", label: "Cricket" },
  { id: "NBA", label: "NBA" },
  { id: "Sports", label: "Sports" },
  { id: "Science", label: "Science" },
];

const AutoScriptPanel: React.FC<AutoScriptPanelProps> = ({
  autoLoading,
  selectedCategory,
  selectedSource,
  sources,
  onCategoryChange,
  onSourceChange,
  onGenerate,
}) => {
  return (
    <Paper sx={{ p: 4, mb: 4, bgcolor: "rgba(25, 118, 210, 0.04)", border: "1px dashed #1976d2" }}>
      <Typography variant="h6" sx={{ display: "flex", alignItems: "center", mb: 2, color: "#1976d2" }}>
        <AutoFixHighIcon sx={{ mr: 1 }} /> Magic Auto-Scripting (with Ollama)
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>
        Select a global news category and source. Ollama will fetch the latest headlines and automatically create a 5-scene script for you.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>Select Category:</Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
          {categoryOptions.map((cat) => (
            <Chip
              key={cat.id}
              label={cat.label}
              clickable
              color={selectedCategory === cat.id ? "primary" : "default"}
              variant={selectedCategory === cat.id ? "filled" : "outlined"}
              onClick={() => onCategoryChange(cat.id)}
            />
          ))}
        </Stack>
      </Box>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={8}>
          <FormControl fullWidth>
            <InputLabel id="news-source-label">Select News Source</InputLabel>
            <Select
              labelId="news-source-label"
              value={selectedSource}
              label="Select News Source"
              onChange={(e) => onSourceChange(e.target.value)}
            >
              {sources
                .filter((source) => source.category === selectedCategory)
                .map((source) => (
                  <MenuItem key={source.id} value={source.id}>
                    {source.name} {source.subCategory ? `(${source.subCategory})` : ""}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={onGenerate}
            disabled={autoLoading || !selectedSource}
            startIcon={autoLoading ? <CircularProgress size={20} color="inherit" /> : <AutoFixHighIcon />}
            sx={{ height: "56px" }}
          >
            {autoLoading ? "Generating..." : "Generate Script"}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default AutoScriptPanel;
