import React from "react";
import { Card, CardContent, Grid, LinearProgress, Stack, Typography } from "@mui/material";

interface QuotaMetric {
  label: string;
  used: number;
  limit: number;
  unit?: string;
}

interface QuotaUsageProps {
  quotas: QuotaMetric[];
}

const QuotaUsage: React.FC<QuotaUsageProps> = ({ quotas }) => {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Quota Usage</Typography>
          <Grid container spacing={2}>
            {quotas.map((metric) => {
              const percent = metric.limit > 0 ? Math.min(100, (metric.used / metric.limit) * 100) : 0;
              return (
                <Grid item xs={12} md={4} key={metric.label}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">{metric.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {metric.used.toLocaleString()} / {metric.limit.toLocaleString()} {metric.unit ?? ""}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={percent}
                      color={percent >= 90 ? "error" : percent >= 75 ? "warning" : "primary"}
                    />
                  </Stack>
                </Grid>
              );
            })}
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default QuotaUsage;
