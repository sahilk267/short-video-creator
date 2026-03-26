import React from "react";
import { Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

export interface IntegrationRecord {
  id: string;
  platform: "youtube" | "instagram" | "facebook" | "telegram";
  connected: boolean;
}

interface IntegrationsProps {
  items: IntegrationRecord[];
  onToggle: (id: string, nextState: boolean) => Promise<void>;
}

const Integrations: React.FC<IntegrationsProps> = ({ items, onToggle }) => {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Connected Integrations</Typography>
          {items.map((item) => (
            <Stack key={item.id} direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ textTransform: "capitalize" }}>{item.platform}</Typography>
                <Chip label={item.connected ? "Connected" : "Not Connected"} color={item.connected ? "success" : "default"} size="small" />
              </Stack>
              <Button
                variant="outlined"
                onClick={() => onToggle(item.id, !item.connected)}
              >
                {item.connected ? "Disconnect" : "Connect"}
              </Button>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default Integrations;
