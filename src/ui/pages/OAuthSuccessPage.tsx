import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Container, Paper, Typography, Button, Box, Alert, Chip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function OAuthSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get("status");
  const provider = params.get("provider");
  const accountId = params.get("accountId");
  const reason = params.get("reason");

  const success = status === "success";

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, bgcolor: "#1e293b", textAlign: "center" }}>
        {success ? (
          <CheckCircleIcon sx={{ fontSize: 64, color: "#4ade80" }} />
        ) : (
          <ErrorIcon sx={{ fontSize: 64, color: "#f87171" }} />
        )}
        <Typography variant="h5" fontWeight={700} sx={{ mt: 2, mb: 1 }}>
          {success ? "Account Connected" : "Connection Failed"}
        </Typography>
        {provider && <Chip label={provider} size="small" color="primary" variant="outlined" sx={{ mb: 2 }} />}

        {success ? (
          <Alert severity="success" sx={{ mt: 2 }}>
            {accountId
              ? `Your ${provider} account was connected and is ready to publish.`
              : `Your ${provider} account was connected.`}
          </Alert>
        ) : (
          <Alert severity="error" sx={{ mt: 2 }}>
            {reason || "An unknown error occurred during OAuth."}
          </Alert>
        )}

        <Box sx={{ mt: 3 }}>
          <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate("/profiles")}>
            Back to Profiles
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default OAuthSuccessPage;
