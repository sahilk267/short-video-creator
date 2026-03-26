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
  TextField,
  Typography,
} from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import { useModerationMutation } from "../../hooks/useContentSuggestions";

interface ModerationCheckerProps {
  initialText?: string;
}

const ModerationChecker: React.FC<ModerationCheckerProps> = ({ initialText = "" }) => {
  const [text, setText] = useState(initialText);
  const mutation = useModerationMutation();

  const handleCheck = () => {
    if (text.trim()) {
      mutation.mutate({ text });
    }
  };

  const result = mutation.data;
  const safePct = result?.score != null ? Math.round((1 - result.score) * 100) : null;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <ShieldIcon color="primary" />
          <Typography variant="h6">Content Moderation</Typography>
        </Box>

        <TextField
          fullWidth
          size="small"
          label="Text to moderate"
          multiline
          minRows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste script, title, or description to check for policy violations…"
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          startIcon={mutation.isLoading ? <CircularProgress size={16} color="inherit" /> : <ShieldIcon />}
          onClick={handleCheck}
          disabled={mutation.isLoading || !text.trim()}
        >
          Check Content
        </Button>

        {mutation.error && (
          <Alert severity="error" sx={{ mt: 2 }}>{String(mutation.error)}</Alert>
        )}

        {result && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              {result.safe ? (
                <CheckCircleIcon color="success" fontSize="large" />
              ) : (
                <WarningIcon color="error" fontSize="large" />
              )}
              <Box>
                <Typography variant="h6" color={result.safe ? "success.main" : "error.main"}>
                  {result.safe ? "Content is Safe" : "Violations Detected"}
                </Typography>
                {result.details && (
                  <Typography variant="body2" color="text.secondary">{result.details}</Typography>
                )}
              </Box>
            </Box>

            {safePct != null && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2">Safety Score</Typography>
                  <Typography variant="body2" fontWeight={600}>{safePct}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={safePct}
                  color={safePct >= 80 ? "success" : safePct >= 50 ? "warning" : "error"}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}

            {result.flags.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Policy Flags</Typography>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  {result.flags.map((flag) => (
                    <Chip key={flag} label={flag} size="small" color="error" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            {result.flags.length === 0 && result.safe && (
              <Typography variant="body2" color="text.secondary">No policy violations found.</Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ModerationChecker;
