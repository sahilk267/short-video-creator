/**
 * Button Component - Wrapper around MUI Button with variants
 */

import React from "react";
import {
  Button as MUIButton,
  ButtonProps as MUIButtonProps,
  CircularProgress,
} from "@mui/material";

export interface ButtonProps extends Omit<MUIButtonProps, "color"> {
  isLoading?: boolean;
  color?: "primary" | "secondary" | "success" | "error" | "warning" | "info";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ isLoading = false, disabled, children, ...props }, ref) => {
    return (
      <MUIButton
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            {children}
          </>
        ) : (
          children
        )}
      </MUIButton>
    );
  },
);

Button.displayName = "Button";

export default Button;
