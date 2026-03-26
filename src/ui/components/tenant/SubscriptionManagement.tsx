import React from "react";
import { Alert, Button, Card, CardContent, Stack, Typography } from "@mui/material";

interface SubscriptionManagementProps {
  currentPlan: "free" | "starter" | "pro" | "enterprise";
  onCancel: () => Promise<void>;
  cancelling: boolean;
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ currentPlan, onCancel, cancelling }) => {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Subscription Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Current plan: {currentPlan}
          </Typography>
          {currentPlan === "free" ? (
            <Alert severity="info">Free plan has no cancellable subscription.</Alert>
          ) : (
            <Button color="error" variant="outlined" disabled={cancelling} onClick={onCancel}>
              {cancelling ? "Canceling..." : "Cancel Subscription"}
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default SubscriptionManagement;
