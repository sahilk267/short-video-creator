/**
 * Toast Component - Notification displayer with Snackbar
 */

import React from "react";
import {
  Snackbar,
  Alert,
  AlertProps,
  SnackbarCloseReason,
} from "@mui/material";
import { useUIStore } from "../store/uiStore";

export interface ToastProps {
  anchorOrigin?: {
    vertical: "top" | "bottom";
    horizontal: "left" | "center" | "right";
  };
  autoHideDuration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  anchorOrigin = { vertical: "bottom", horizontal: "left" },
  autoHideDuration = 5000,
}) => {
  const { notifications, removeNotification } = useUIStore();

  const handleClose = (
    _event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === "clickaway") return;
  };

  return (
    <>
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open
          autoHideDuration={notification.autoClose ? (notification.duration ?? autoHideDuration) : undefined}
          onClose={() => removeNotification(notification.id)}
          anchorOrigin={anchorOrigin}
        >
          <Alert
            onClose={() => removeNotification(notification.id)}
            severity={notification.type as AlertProps["severity"]}
            sx={{ width: "100%" }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

Toast.displayName = "Toast";

export default Toast;
