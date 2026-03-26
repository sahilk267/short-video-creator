import React from "react";
import {
  Box,
  Button,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

export interface SceneFormData {
  text: string;
  searchTerms: string;
  headline: string;
  visualPrompt: string;
}

interface SceneEditorListProps {
  scenes: SceneFormData[];
  onAddScene: () => void;
  onRemoveScene: (index: number) => void;
  onSceneChange: (index: number, field: keyof SceneFormData, value: string) => void;
}

const SceneEditorList: React.FC<SceneEditorListProps> = ({
  scenes,
  onAddScene,
  onRemoveScene,
  onSceneChange,
}) => {
  return (
    <>
      <Typography variant="h5" component="h2" gutterBottom>
        Scenes
      </Typography>

      {scenes.map((scene, index) => (
        <Paper key={index} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Scene {index + 1}</Typography>
            {scenes.length > 1 && (
              <IconButton onClick={() => onRemoveScene(index)} color="error" size="small">
                <DeleteIcon />
              </IconButton>
            )}
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Text"
                multiline
                rows={4}
                value={scene.text}
                onChange={(e) => onSceneChange(index, "text", e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Headline (Optional)"
                value={scene.headline}
                onChange={(e) => onSceneChange(index, "headline", e.target.value)}
                placeholder="e.g. BREAKING NEWS: MARKET CRASHES"
                helperText="Short catchy headline for the top banner. If empty, it will be auto-generated."
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Visual Prompt (for AI Images)"
                value={scene.visualPrompt}
                onChange={(e) => onSceneChange(index, "visualPrompt", e.target.value)}
                helperText="Detailed description for AI image generation. Leave empty to use scene text."
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Search Terms (comma-separated)"
                value={scene.searchTerms}
                onChange={(e) => onSceneChange(index, "searchTerms", e.target.value)}
                helperText="Enter keywords for background video, separated by commas"
                required
              />
            </Grid>
          </Grid>
        </Paper>
      ))}

      <Box display="flex" justifyContent="center" mb={4}>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={onAddScene}>
          Add Scene
        </Button>
      </Box>
    </>
  );
};

export default SceneEditorList;
