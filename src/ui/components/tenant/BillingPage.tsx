import React from "react";
import { Alert, Button, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";

export interface BillingData {
  plan: "free" | "starter" | "pro" | "enterprise";
  month: string;
  amountUsd: number;
  usageUsd?: number;
  status?: "active" | "past_due" | "canceled";
}

interface BillingPageProps {
  billing: BillingData | null;
  onPlanChange: (nextPlan: BillingData["plan"]) => Promise<void>;
  changingPlan: boolean;
}

const PLANS: Array<{ key: BillingData["plan"]; price: string; blurb: string }> = [
  { key: "free", price: "$0", blurb: "For prototypes and evaluation." },
  { key: "starter", price: "$29", blurb: "For solo creators with steady publishing." },
  { key: "pro", price: "$99", blurb: "For teams needing faster throughput." },
  { key: "enterprise", price: "Custom", blurb: "For advanced compliance and scale." },
];

const BillingPage: React.FC<BillingPageProps> = ({ billing, onPlanChange, changingPlan }) => {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Billing</Typography>
          {billing ? (
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Chip label={`Plan: ${billing.plan}`} color="primary" />
              <Chip label={`Month: ${billing.month}`} />
              <Chip label={`Billed: $${billing.amountUsd.toFixed(2)}`} />
              <Chip label={`Status: ${billing.status ?? "active"}`} color="success" />
            </Stack>
          ) : (
            <Alert severity="info">No billing snapshot available yet.</Alert>
          )}

          <Typography variant="subtitle2">Upgrade / Downgrade Options</Typography>
          <Grid container spacing={2}>
            {PLANS.map((plan) => (
              <Grid item xs={12} md={6} key={plan.key}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography variant="subtitle1" sx={{ textTransform: "capitalize" }}>
                        {plan.key}
                      </Typography>
                      <Typography variant="h6">{plan.price}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {plan.blurb}
                      </Typography>
                      <Button
                        variant="contained"
                        disabled={changingPlan || billing?.plan === plan.key}
                        onClick={() => onPlanChange(plan.key)}
                      >
                        {billing?.plan === plan.key ? "Current Plan" : "Switch Plan"}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default BillingPage;
