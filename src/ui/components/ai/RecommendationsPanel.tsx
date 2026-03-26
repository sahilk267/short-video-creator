import React from "react";
import { Alert, AlertTitle, Paper, Stack, Typography } from "@mui/material";
import type { AIRecommendation, SuggestionResult } from "../../hooks/useAIMetrics";

interface RecommendationsPanelProps {
  recommendations: AIRecommendation[];
  latestSuggestion: SuggestionResult | null;
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({ recommendations, latestSuggestion }) => {
  return (
    <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
      <Stack spacing={2}>
        <div>
          <Typography variant="h6" fontWeight={700}>Recommendations</Typography>
          <Typography variant="body2" color="text.secondary">
            System-generated remediation notes plus the latest sandbox suggestion.
          </Typography>
        </div>

        {latestSuggestion && (
          <Alert severity={latestSuggestion.health.fallbackMode ? "warning" : "info"}>
            <AlertTitle>Latest suggestion</AlertTitle>
            {latestSuggestion.suggestion.recommendation} Score {latestSuggestion.suggestion.score}, confidence {Math.round(latestSuggestion.suggestion.confidence * 100)}%.
          </Alert>
        )}

        {recommendations.map((recommendation) => (
          <Alert key={`${recommendation.title}-${recommendation.detail}`} severity={recommendation.severity}>
            <AlertTitle>{recommendation.title}</AlertTitle>
            {recommendation.detail}
          </Alert>
        ))}
      </Stack>
    </Paper>
  );
};

export default RecommendationsPanel;