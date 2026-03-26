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
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import CheckIcon from "@mui/icons-material/Check";
import SubtitlesIcon from "@mui/icons-material/Subtitles";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import ImageIcon from "@mui/icons-material/Image";
import { useAccessibilityMutation } from "../../hooks/useContentSuggestions";

interface AccessibilityCheckerProps {
  initialScript?: string;
}

const AccessibilityChecker: React.FC<AccessibilityCheckerProps> = ({ initialScript = "" }) => {
  const [script, setScript] = useState(initialScript);
  const mutation = useAccessibilityMutation();

  const handleCheck = () => {
    if (script.trim()) {
      mutation.mutate({ script });
    }
  };

  const result = mutation.data;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <AccessibilityNewIcon color="primary" />
          <Typography variant="h6">Accessibility Checker</Typography>
        </Box>

        <TextField
          fullWidth
          size="small"
          label="Script"
          multiline
          minRows={3}
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Paste your video script to generate accessibility features…"
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          startIcon={
            mutation.isLoading
              ? <CircularProgress size={16} color="inherit" />
              : <AccessibilityNewIcon />
          }
          onClick={handleCheck}
          disabled={mutation.isLoading || !script.trim()}
        >
          Analyse Accessibility
        </Button>

        {mutation.error && (
          <Alert severity="error" sx={{ mt: 2 }}>{String(mutation.error)}</Alert>
        )}

        {result && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />

            {result.score != null && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2">Accessibility Score</Typography>
                  <Typography variant="body2" fontWeight={600}>{result.score}/100</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={result.score}
                  color={result.score >= 80 ? "success" : result.score >= 50 ? "warning" : "error"}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}

            {result.captions && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <SubtitlesIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2">Captions</Typography>
                  <Chip label="Generated" size="small" color="success" />
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: "action.hover",
                    whiteSpace: "pre-wrap",
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                  }}
                >
                  {result.captions}
                </Typography>
              </Box>
            )}

            {result.audioDescription && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <RecordVoiceOverIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2">Audio Description</Typography>
                </Box>
                <Typography variant="body2" sx={{ p: 1.5, borderRadius: 1, bgcolor: "action.hover" }}>
                  {result.audioDescription}
                </Typography>
              </Box>
            )}

            {result.altText && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <ImageIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2">Alt Text</Typography>
                </Box>
                <Typography variant="body2" sx={{ p: 1.5, borderRadius: 1, bgcolor: "action.hover" }}>
                  {result.altText}
                </Typography>
              </Box>
            )}

            {result.recommendations && result.recommendations.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Recommendations</Typography>
                <List dense disablePadding>
                  {result.recommendations.map((rec, idx) => (
                    <ListItem key={idx} disableGutters>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <CheckIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={rec} primaryTypographyProps={{ variant: "body2" }} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AccessibilityChecker;
