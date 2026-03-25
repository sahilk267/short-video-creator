import axios from "axios";
import type { Config } from "../config";
import { logger } from "../logger";

export interface AlertPayload {
  summary: string;
  severity: "info" | "warning" | "critical";
  details?: Record<string, unknown>;
}

export class AlertingService {
  constructor(private readonly config: Config) {}

  public async notify(payload: AlertPayload): Promise<void> {
    await Promise.allSettled([
      this.notifySlack(payload),
      this.notifyPagerDuty(payload),
      this.notifyEmail(payload),
    ]);
  }

  private async notifySlack(payload: AlertPayload): Promise<void> {
    if (!this.config.slackWebhookUrl) {
      return;
    }

    await axios.post(this.config.slackWebhookUrl, {
      text: `[${payload.severity.toUpperCase()}] ${payload.summary}`,
      attachments: payload.details
        ? [{ text: JSON.stringify(payload.details, null, 2) }]
        : undefined,
    });
  }

  private async notifyPagerDuty(payload: AlertPayload): Promise<void> {
    if (!this.config.pagerDutyRoutingKey) {
      return;
    }

    await axios.post("https://events.pagerduty.com/v2/enqueue", {
      routing_key: this.config.pagerDutyRoutingKey,
      event_action: "trigger",
      payload: {
        summary: payload.summary,
        severity: payload.severity === "critical" ? "critical" : "warning",
        source: "short-video-maker",
        custom_details: payload.details,
      },
    });
  }

  private async notifyEmail(payload: AlertPayload): Promise<void> {
    if (!this.config.alertEmailTo) {
      return;
    }

    logger.warn(
      { to: this.config.alertEmailTo, payload },
      "Email alert configured but SMTP transport is not implemented; logging alert instead",
    );
  }
}
