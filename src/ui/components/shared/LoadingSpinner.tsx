/**
 * LoadingSpinner Component - Reusable loading indicator with overlay option
 */

import React from "react";
import {
  Box,
  CircularProgress,
  Backdrop,
  Typography,
  CircularProgressProps,
} from "@mui/material";

export interface LoadingSpinnerProps extends Partial<CircularProgressProps> {
  isLoading?: boolean;
  message?: string;
  overlay?: boolean;
  fullScreen?: boolean;
  size?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  isLoading = true,
  message = "Loading...",
  overlay = false,
  fullScreen = false,
  size = 40,
  ...props
}) => {
  if (!isLoading) return null;

  const spinner = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <CircularProgress size={size} {...props} />
      {message && (
        <Typography variant="body2" color="textSecondary">
          {message}
        </Typography>
      )}
    </Box>
  );

  if (overlay) {
    return (
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
        open
      >
        {spinner}
      </Backdrop>
    );
  }

  if (fullScreen) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          width: "100%",
        }}
      >
        {spinner}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
      {spinner}
    </Box>
  );
};

LoadingSpinner.displayName = "LoadingSpinner";

export default LoadingSpinner;
