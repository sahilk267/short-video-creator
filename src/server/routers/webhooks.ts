import { Router } from "express";
import type { Config } from "../../config";
import { WebhookNotificationEngine } from "../../services/WebhookNotificationEngine";
import { logger } from "../../logger";

export class WebhooksRouter {
  readonly router: Router;
  private engine: WebhookNotificationEngine;

  constructor(config: Config) {
    this.router = Router();
    this.engine = new WebhookNotificationEngine(config.dataDirPath);
    this.registerRoutes();
  }

  private registerRoutes() {
    // GET /api/webhooks — list all webhooks
    this.router.get("/", (_req, res) => {
      try {
        res.json({ webhooks: this.engine.getWebhooks() });
      } catch (err) {
        logger.error({ err }, "GET /webhooks failed");
        res.status(500).json({ error: "Failed to fetch webhooks" });
      }
    });

    // GET /api/webhooks/stats — stats + recent logs
    this.router.get("/stats", (_req, res) => {
      try {
        res.json(this.engine.getStats());
      } catch (err) {
        logger.error({ err }, "GET /webhooks/stats failed");
        res.status(500).json({ error: "Failed to fetch stats" });
      }
    });

    // GET /api/webhooks/logs — recent notification logs
    this.router.get("/logs", (req, res) => {
      try {
        const limit = Number(req.query.limit) || 100;
        res.json({ logs: this.engine.getLogs(limit) });
      } catch (err) {
        logger.error({ err }, "GET /webhooks/logs failed");
        res.status(500).json({ error: "Failed to fetch logs" });
      }
    });

    // POST /api/webhooks — create webhook
    this.router.post("/", (req, res) => {
      try {
        const { name, channel, events, telegramBotToken, telegramChatId, slackWebhookUrl, discordWebhookUrl, customUrl, customHeaders, customMethod } = req.body;
        if (!name || !channel || !events?.length) {
          return res.status(400).json({ error: "name, channel, and events are required" });
        }
        const webhook = this.engine.addWebhook({
          name,
          channel,
          enabled: true,
          events,
          telegramBotToken,
          telegramChatId,
          slackWebhookUrl,
          discordWebhookUrl,
          customUrl,
          customHeaders,
          customMethod,
        });
        res.status(201).json({ webhook });
      } catch (err) {
        logger.error({ err }, "POST /webhooks failed");
        res.status(500).json({ error: "Failed to create webhook" });
      }
    });

    // PUT /api/webhooks/:id — update webhook
    this.router.put("/:id", (req, res) => {
      try {
        const updated = this.engine.updateWebhook(req.params.id, req.body);
        if (!updated) return res.status(404).json({ error: "Webhook not found" });
        res.json({ webhook: updated });
      } catch (err) {
        logger.error({ err }, "PUT /webhooks/:id failed");
        res.status(500).json({ error: "Failed to update webhook" });
      }
    });

    // DELETE /api/webhooks/:id — delete webhook
    this.router.delete("/:id", (req, res) => {
      try {
        const ok = this.engine.deleteWebhook(req.params.id);
        if (!ok) return res.status(404).json({ error: "Webhook not found" });
        res.json({ success: true });
      } catch (err) {
        logger.error({ err }, "DELETE /webhooks/:id failed");
        res.status(500).json({ error: "Failed to delete webhook" });
      }
    });

    // PATCH /api/webhooks/:id/toggle — enable/disable
    this.router.patch("/:id/toggle", (req, res) => {
      try {
        const updated = this.engine.toggleWebhook(req.params.id);
        if (!updated) return res.status(404).json({ error: "Webhook not found" });
        res.json({ webhook: updated });
      } catch (err) {
        logger.error({ err }, "PATCH /webhooks/:id/toggle failed");
        res.status(500).json({ error: "Failed to toggle webhook" });
      }
    });

    // POST /api/webhooks/:id/test — send test notification
    this.router.post("/:id/test", async (req, res) => {
      try {
        const results = await this.engine.testWebhook(req.params.id);
        res.json({ results });
      } catch (err) {
        logger.error({ err }, "POST /webhooks/:id/test failed");
        res.status(500).json({ error: (err as Error).message });
      }
    });

    // POST /api/webhooks/notify — manually trigger event
    this.router.post("/notify", async (req, res) => {
      try {
        const { event, title, message, data, severity } = req.body;
        if (!event || !title || !message) {
          return res.status(400).json({ error: "event, title, and message are required" });
        }
        const results = await this.engine.notify(event, title, message, data, severity);
        res.json({ results, count: results.length });
      } catch (err) {
        logger.error({ err }, "POST /webhooks/notify failed");
        res.status(500).json({ error: "Failed to dispatch notification" });
      }
    });
  }
}
