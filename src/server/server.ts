import http from "http";
import express from "express";
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import { ShortCreator } from "../short-creator/ShortCreator";
import { APIRouter } from "./routers/rest";
import { MCPRouter } from "./routers/mcp";
import { HealthRouter } from "./routers/health";
import { PublishRouter } from "./routers/publish";
import { QueueRouter } from "./routers/queue";
import { TenantRouter } from "./routers/tenants";
import { MarketingRouter } from "./routers/marketing";
import { AiRouter } from "./routers/ai";
import { ContentRouter } from "./routers/content";
import { TrendsRouter } from "./routers/trends";
import { HooksRouter } from "./routers/hooks";
import { TranslateRouter } from "./routers/translate";
import { ImageRouter } from "./routers/image";
import { RecycleRouter } from "./routers/recycle";
import { CostsRouter } from "./routers/costs";
import { ShadowbanRouter } from "./routers/shadowban";
import { StrategyRouter } from "./routers/strategy";
import { WebhooksRouter } from "./routers/webhooks";
import { BrandingRouter } from "./routers/branding";
import { HumanizedRouter } from "./routers/humanized";
import { ThumbnailRouter } from "./routers/thumbnail";
import { EditingRouter } from "./routers/editing";
import { VisualRouter } from "./routers/visual";
import { AudioRouter } from "./routers/audio";
import { EmotionalRouter } from "./routers/emotional";
import { AttentionRouter } from "./routers/attention";
import { QualityRouter } from "./routers/quality";
import { EngagementRouter } from "./routers/engagement";
import { AccountRouter } from "./routers/account";
import { WatermarkRouter } from "./routers/watermark";
import { VideoLibraryRouter } from "./routers/videolibrary";
import { ScheduleRouter } from "./routers/schedule";
import { apiRateLimiter } from "./rateLimit";
import { logger } from "../logger";
import { Config } from "../config";

export class Server {
  private app: express.Application;
  private config: Config;

  constructor(config: Config, shortCreator: ShortCreator) {
    this.config = config;
    this.app = express();
    this.app.set("trust proxy", 1);

    const apiRouter = new APIRouter(config, shortCreator);
    const mcpRouter = new MCPRouter(shortCreator);
    const healthRouter = new HealthRouter(config);
    const publishRouter = new PublishRouter(config);
    const queueRouter = new QueueRouter(config, shortCreator);
    const tenantRouter = new TenantRouter(config);
    const marketingRouter = new MarketingRouter(config);
    const aiRouter = new AiRouter(config);
    const contentRouter = new ContentRouter();
    const trendsRouter = new TrendsRouter();
    const hooksRouter = new HooksRouter(config);
    const translateRouter = new TranslateRouter();
    const imageRouter = new ImageRouter(config);
    const recycleRouter = new RecycleRouter(config);
    const costsRouter = new CostsRouter(config);
    const shadowbanRouter = new ShadowbanRouter(config);
    const strategyRouter = new StrategyRouter(config);
    const webhooksRouter = new WebhooksRouter(config);
    const brandingRouter = new BrandingRouter(config);
    const humanizedRouter = new HumanizedRouter(config);
    const thumbnailRouter = new ThumbnailRouter();
    const editingRouter = new EditingRouter();
    const visualRouter = new VisualRouter();
    const audioRouter = new AudioRouter();
    const emotionalRouter = new EmotionalRouter();
    const attentionRouter = new AttentionRouter();
    const qualityRouter = new QualityRouter();
    const engagementRouter = new EngagementRouter();
    const accountRouter = new AccountRouter(config);
    const watermarkRouter = new WatermarkRouter();
    const videoLibraryRouter = new VideoLibraryRouter(config);
    const scheduleRouter = new ScheduleRouter(config);

    this.app.use("/api", apiRateLimiter);
    this.app.use("/api", apiRouter.router);
    this.app.use("/mcp", mcpRouter.router);
    this.app.use("/api/health", healthRouter.router);
    this.app.use("/api/publish", publishRouter.router);
    this.app.use("/api/queue", queueRouter.router);
    this.app.use("/api/tenants", tenantRouter.router);
    this.app.use("/api/marketing", marketingRouter.router);
    this.app.use("/api/ai", aiRouter.router);
    this.app.use("/api/content", contentRouter.router);
    this.app.use("/api/trends", trendsRouter.router);
    this.app.use("/api/hooks", hooksRouter.router);
    this.app.use("/api/translate", translateRouter.router);
    this.app.use("/api/image", imageRouter.router);
    this.app.use("/api/recycle", recycleRouter.router);
    this.app.use("/api/costs", costsRouter.router);
    this.app.use("/api/shadowban", shadowbanRouter.router);
    this.app.use("/api/strategy", strategyRouter.router);
    this.app.use("/api/webhooks", webhooksRouter.router);
    this.app.use("/api/branding", brandingRouter.router);
    this.app.use("/api/humanized", humanizedRouter.router);
    this.app.use("/api/thumbnail", thumbnailRouter.router);
    this.app.use("/api/editing", editingRouter.router);
    this.app.use("/api/visual", visualRouter.router);
    this.app.use("/api/audio", audioRouter.router);
    this.app.use("/api/emotional", emotionalRouter.router);
    this.app.use("/api/attention", attentionRouter.router);
    this.app.use("/api/quality", qualityRouter.router);
    this.app.use("/api/engagement", engagementRouter.router);
    this.app.use("/api/account", accountRouter.router);
    this.app.use("/api/watermark", watermarkRouter.router);
    this.app.use("/api/videolibrary", videoLibraryRouter.router);
    this.app.use("/api/schedule", scheduleRouter.router);

    // API Documentation (Swagger UI)
    this.app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "AI Viral Content Empire – API Docs",
      customCss: ".swagger-ui .topbar { background-color: #6366f1; }",
    }));
    this.app.get("/api/docs.json", (_req: ExpressRequest, res: ExpressResponse) => {
      res.setHeader("Content-Type", "application/json");
      res.send(swaggerSpec);
    });

    // Serve static files from the UI build
    this.app.use(express.static(path.join(__dirname, "../../dist/ui")));
    this.app.use(
      "/static",
      express.static(path.join(__dirname, "../../static")),
    );

    // Serve the React app for all other routes (must be last)
    this.app.get("*", (req: ExpressRequest, res: ExpressResponse) => {
      res.sendFile(path.join(__dirname, "../../dist/ui/index.html"));
    });
  }

  public start(): http.Server {
    const server = this.app.listen(this.config.port, () => {
      logger.info(
        { port: this.config.port, mcp: "/mcp", api: "/api" },
        "MCP and API server is running",
      );
      logger.info(
        `UI server is running on http://localhost:${this.config.port}`,
      );
    });

    server.on("error", (error: Error) => {
      logger.error(error, "Error starting server");
    });

    return server;
  }

  public getApp() {
    return this.app;
  }
}
