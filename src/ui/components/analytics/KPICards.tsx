/**
 * KPICards Component - Key Performance Indicator summary cards
 */

import React from "react";
import { Box, Card, CardContent, Typography, Chip, Skeleton, Grid } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import MouseIcon from "@mui/icons-material/Mouse";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import { KPIsummary } from "../../hooks/useAnalytics";

interface KPICardsProps {
  kpis: KPIsummary | null;
  loading?: boolean;
}

interface KPICardData {
  label: string;
  value: string;
  change: number;
  icon: React.ReactElement;
  color: string;
  bgColor: string;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

const TrendChip: React.FC<{ change: number }> = ({ change }) => {
  const isPositive = change >= 0;
  return (
    <Chip
      size="small"
      icon={isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
      label={formatChange(change)}
      sx={{
        backgroundColor: isPositive ? "#e8f5e9" : "#ffebee",
        color: isPositive ? "#2e7d32" : "#c62828",
        fontWeight: 600,
        fontSize: "0.75rem",
        "& .MuiChip-icon": { color: "inherit" },
      }}
    />
  );
};

export const KPICards: React.FC<KPICardsProps> = ({ kpis, loading = false }) => {
  if (loading) {
    return (
      <Grid container spacing={3}>
        {[0, 1, 2, 3].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rounded" height={140} />
          </Grid>
        ))}
      </Grid>
    );
  }

  const cards: KPICardData[] = [
    {
      label: "Total Views",
      value: formatNumber(kpis?.totalViews || 0),
      change: kpis?.viewsChange || 0,
      icon: <VisibilityIcon sx={{ fontSize: 32 }} />,
      color: "#1565c0",
      bgColor: "#e3f2fd",
    },
    {
      label: "Total Engagement",
      value: formatNumber(kpis?.totalEngagement || 0),
      change: kpis?.engagementChange || 0,
      icon: <ThumbUpIcon sx={{ fontSize: 32 }} />,
      color: "#6a1b9a",
      bgColor: "#f3e5f5",
    },
    {
      label: "Avg Click-Through Rate",
      value: `${(kpis?.avgCTR || 0).toFixed(2)}%`,
      change: kpis?.ctrChange || 0,
      icon: <MouseIcon sx={{ fontSize: 32 }} />,
      color: "#e65100",
      bgColor: "#fff3e0",
    },
    {
      label: "Trending Score",
      value: `${kpis?.trendingScore || 0}/100`,
      change: kpis?.trendingChange || 0,
      icon: <WhatshotIcon sx={{ fontSize: 32 }} />,
      color: "#b71c1c",
      bgColor: "#ffebee",
    },
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card) => (
        <Grid item xs={12} sm={6} md={3} key={card.label}>
          <Card
            elevation={2}
            sx={{
              height: "100%",
              borderLeft: `4px solid ${card.color}`,
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": { transform: "translateY(-2px)", boxShadow: 4 },
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography variant="caption" color="textSecondary" fontWeight={500}>
                    {card.label}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} sx={{ color: card.color, lineHeight: 1.2, mt: 0.5 }}>
                    {card.value}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: card.bgColor,
                    color: card.color,
                  }}
                >
                  {card.icon}
                </Box>
              </Box>
              <Box sx={{ mt: 2 }}>
                <TrendChip change={card.change} />
                <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                  vs previous period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default KPICards;
