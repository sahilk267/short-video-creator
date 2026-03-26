import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Button from "./Button";

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
        <InfoOutlinedIcon sx={{ fontSize: 36, color: "text.secondary" }} />
        <Typography variant="h6" fontWeight={700}>{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520 }}>
          {description}
        </Typography>
        {actionLabel && onAction && (
          <Button variant="contained" size="small" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default EmptyState;
