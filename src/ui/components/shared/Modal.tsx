/**
 * Modal Component - Dialog wrapper with consistent styling
 */

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogProps,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

export interface ModalProps extends Omit<DialogProps, "onClose"> {
  title?: string;
  onClose: () => void;
  actions?: React.ReactNode;
  showCloseButton?: boolean;
}

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      title,
      onClose,
      actions,
      children,
      showCloseButton = true,
      ...props
    },
    ref,
  ) => {
    return (
      <Dialog ref={ref} onClose={onClose} {...props}>
        {title && (
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {title}
            {showCloseButton && (
              <IconButton
                size="small"
                onClick={onClose}
                sx={{ position: "absolute", right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </DialogTitle>
        )}
        {children && <DialogContent>{children}</DialogContent>}
        {actions && <DialogActions>{actions}</DialogActions>}
      </Dialog>
    );
  },
);

Modal.displayName = "Modal";

export default Modal;
