/**
 * PlatformSelector Component - Choose publishing platforms
 */

import React from "react";
import {
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
} from "@mui/material";
import {
  YouTube as YouTubeIcon,
  SendSharp as TelegramIcon,
  PhotoCamera as InstagramIcon,
  Facebook as FacebookIcon,
} from "@mui/icons-material";

const PLATFORMS = [
  {
    id: "youtube",
    label: "YouTube",
    icon: YouTubeIcon,
    description: "Upload to YouTube channel",
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: TelegramIcon,
    description: "Share on Telegram channels",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: InstagramIcon,
    description: "Post to Instagram account",
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: FacebookIcon,
    description: "Share on Facebook pages",
  },
];

export interface PlatformSelectorProps {
  selected: string[];
  onSelectionChange: (platforms: string[]) => void;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selected,
  onSelectionChange,
}) => {
  const handleToggle = (platformId: string) => {
    if (selected.includes(platformId)) {
      onSelectionChange(selected.filter((p) => p !== platformId));
    } else {
      onSelectionChange([...selected, platformId]);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom sx={{ mb: 3 }}>
        Select platforms where you want to publish these videos:
      </Typography>

      <Grid container spacing={2}>
        {PLATFORMS.map((platform) => {
          const Icon = platform.icon;
          const isSelected = selected.includes(platform.id);

          return (
            <Grid item xs={12} sm={6} md={6} key={platform.id}>
              <Card
                onClick={() => handleToggle(platform.id)}
                sx={{
                  cursor: "pointer",
                  border: isSelected ? "2px solid" : "1px solid",
                  borderColor: isSelected ? "primary.main" : "#e0e0e0",
                  backgroundColor: isSelected ? "rgba(25, 118, 210, 0.05)" : "transparent",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: 2,
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                    <Icon sx={{ fontSize: 32, color: isSelected ? "primary.main" : "text.secondary" }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">{platform.label}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {platform.description}
                      </Typography>
                    </Box>
                    <Checkbox
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleToggle(platform.id)}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {selected.length > 0 && (
        <Box sx={{ mt: 3, p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
          <Typography variant="caption" color="textSecondary">
            Selected platforms:
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
            {selected.map((platform) => (
              <Chip
                key={platform}
                label={PLATFORMS.find((p) => p.id === platform)?.label}
                size="small"
                onDelete={() => handleToggle(platform)}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PlatformSelector;
