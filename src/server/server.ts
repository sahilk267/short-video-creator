import http from "http";
import express from "express";
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import path from "path";
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
import { logger } from "../logger";
import { Config } from "../config";

export class Server {
  private app: express.Application;
  private config: Config;

  constructor(config: Config, shortCreator: ShortCreator) {
    this.config = config;
    this.app = express();

    const apiRouter = new APIRouter(config, shortCreator);
    const mcpRouter = new MCPRouter(shortCreator);
    const healthRouter = new HealthRouter(config);
    const publishRouter = new PublishRouter(config);
    const queueRouter = new QueueRouter(config, shortCreator);
    const tenantRouter = new TenantRouter(config);
    const marketingRouter = new MarketingRouter(config);
    const aiRouter = new AiRouter(config);
    const contentRouter = new ContentRouter();

    this.app.use("/api", apiRouter.router);
    this.app.use("/mcp", mcpRouter.router);
    this.app.use("/api/health", healthRouter.router);
    this.app.use("/api/publish", publishRouter.router);
    this.app.use("/api/queue", queueRouter.router);
    this.app.use("/api/tenants", tenantRouter.router);
    this.app.use("/api/marketing", marketingRouter.router);
    this.app.use("/api/ai", aiRouter.router);
    this.app.use("/api/content", contentRouter.router);

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
