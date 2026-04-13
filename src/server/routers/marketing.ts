import { Router } from "express";
import type { Request, Response } from "express";
import type { Config } from "../../config";
import { AudienceStore } from "../../db/AudienceStore";
import { ABVariantStore } from "../../db/ABVariantStore";
import { AnalyticsStore } from "../../db/AnalyticsStore";
import { SeoOptimizerService } from "../../services/SeoOptimizerService";
import { ViralStrategyService } from "../../services/ViralStrategyService";

export class MarketingRouter {
  public router: Router;
  private audienceStore: AudienceStore;
  private abVariantStore: ABVariantStore;
  private analyticsStore: AnalyticsStore;
  private seoService: SeoOptimizerService;
  private viralService: ViralStrategyService;

  constructor(config: Config) {
    this.router = Router();
    this.audienceStore = new AudienceStore(config.dataDirPath);
    this.abVariantStore = new ABVariantStore(config.dataDirPath);
    this.analyticsStore = new AnalyticsStore(config.dataDirPath);
    this.seoService = new SeoOptimizerService();
    this.viralService = new ViralStrategyService();
    this.router.use(expressJsonMiddleware());
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.post("/audience", (req, res) => this.createAudienceTarget(req, res));
    this.router.get("/audience", (req, res) => this.listAudienceTargets(req, res));

    this.router.post("/seo/optimize", (req, res) => this.optimizeSeo(req, res));

    this.router.post("/ab/variants", (req, res) => this.createVariant(req, res));
    this.router.get("/ab/variants", (req, res) => this.listAllVariants(req, res));
    this.router.get("/ab/variants/:videoId", (req, res) => this.listVariants(req, res));
    this.router.get("/ab/variants/:videoId/results", (req, res) => this.getVariantResults(req, res));
    this.router.post("/ab/assign/:videoId", (req, res) => this.assignVariant(req, res));

    this.router.post("/analytics", (req, res) => this.upsertAnalytics(req, res));
    this.router.get("/analytics", (req, res) => this.listAnalytics(req, res));
    this.router.get("/analytics/:videoId", (req, res) => this.getAnalyticsByVideo(req, res));

    this.router.get("/dashboard", (req, res) => this.getDashboard(req, res));
  }

  private async createAudienceTarget(req: Request, res: Response): Promise<void> {
    const { tenantId, category, location, ageGroup, interests = [], score = 0 } = req.body;
    if (!category || !location || !ageGroup) {
      res.status(400).json({ error: "category, location, ageGroup are required" });
      return;
    }
    const record = await this.audienceStore.add({ tenantId, category, location, ageGroup, interests, score });
    res.status(201).json(record);
  }

  private async listAudienceTargets(_req: Request, res: Response): Promise<void> {
    res.json(await this.audienceStore.list());
  }

  private optimizeSeo(req: Request, res: Response): void {
    const { title = "", description = "", keywords = [], category } = req.body;
    res.json(this.seoService.optimize({ title, description, keywords, category }));
  }

  private async createVariant(req: Request, res: Response): Promise<void> {
    const { videoId, variantKey, title, thumbnail } = req.body;
    if (!videoId || !variantKey || !title) {
      res.status(400).json({ error: "videoId, variantKey, title are required" });
      return;
    }
    const record = await this.abVariantStore.create({ videoId, variantKey, title, thumbnail });
    res.status(201).json(record);
  }

  private async listVariants(req: Request, res: Response): Promise<void> {
    res.json(await this.abVariantStore.list(req.params.videoId));
  }

  private async listAllVariants(_req: Request, res: Response): Promise<void> {
    const analytics = await this.analyticsStore.list();
    const videoIds = Array.from(new Set(analytics.map((record) => record.renderOutputId)));
    const variants = await Promise.all(videoIds.map((videoId) => this.abVariantStore.list(videoId)));
    res.json(variants.flat());
  }

  private async getVariantResults(req: Request, res: Response): Promise<void> {
    const variants = await this.abVariantStore.list(req.params.videoId);
    const results = variants.map((variant) => ({
      ...variant,
      ctr: variant.assignedCount > 0 ? variant.clicks / variant.assignedCount : 0,
    }));
    const winner = [...results].sort((a, b) => {
      const ctrDiff = b.ctr - a.ctr;
      return ctrDiff !== 0 ? ctrDiff : b.assignedCount - a.assignedCount;
    })[0] ?? null;

    res.json({ variants: results, winner });
  }

  private async assignVariant(req: Request, res: Response): Promise<void> {
    const assigned = await this.abVariantStore.assign(req.params.videoId);
    if (!assigned) {
      res.status(404).json({ error: "No variants for this video" });
      return;
    }
    res.json(assigned);
  }

  private async upsertAnalytics(req: Request, res: Response): Promise<void> {
    const saved = await this.analyticsStore.upsert(req.body);
    res.status(201).json(saved);
  }

  private async listAnalytics(_req: Request, res: Response): Promise<void> {
    res.json(await this.analyticsStore.list());
  }

  private async getAnalyticsByVideo(req: Request, res: Response): Promise<void> {
    const records = await this.analyticsStore.getByVideo(req.params.videoId);
    const totals = records.reduce(
      (acc, r) => {
        acc.views += r.views;
        acc.likes += r.likes;
        acc.shares += r.shares;
        acc.comments += r.comments;
        return acc;
      },
      { views: 0, likes: 0, shares: 0, comments: 0 },
    );
    res.json({ records, totals, viral: this.viralService.score(totals) });
  }

  private async getDashboard(_req: Request, res: Response): Promise<void> {
    const analytics = await this.analyticsStore.list();
    const audience = await this.audienceStore.list();
    const totalViews = analytics.reduce((sum, a) => sum + a.views, 0);
    const totalLikes = analytics.reduce((sum, a) => sum + a.likes, 0);
    const totalShares = analytics.reduce((sum, a) => sum + a.shares, 0);
    const totalComments = analytics.reduce((sum, a) => sum + a.comments, 0);
    const totalEngagement = totalLikes + totalShares + totalComments;

    const platformMetrics = Array.from(
      analytics.reduce<Map<string, {
        platform: string;
        views: number;
        likes: number;
        shares: number;
        comments: number;
        ctr: number;
      }>>((acc, record) => {
        const current = acc.get(record.platform) ?? {
          platform: record.platform,
          views: 0,
          likes: 0,
          shares: 0,
          comments: 0,
          ctr: 0,
        };
        current.views += record.views;
        current.likes += record.likes;
        current.shares += record.shares;
        current.comments += record.comments;
        current.ctr = current.views > 0
          ? (current.likes + current.shares + current.comments) / current.views
          : 0;
        acc.set(record.platform, current);
        return acc;
      }, new Map()).values(),
    );

    const topVideos = analytics
      .map((record) => ({
        videoId: record.renderOutputId,
        title: record.externalId || record.renderOutputId,
        platform: record.platform,
        views: record.views,
        likes: record.likes,
        shares: record.shares,
        comments: record.comments,
        ctr: record.views > 0 ? (record.likes + record.shares + record.comments) / record.views : 0,
        watchTime: 0,
        date: record.createdAt,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 20);

    res.json({
      kpis: {
        totalViews,
        totalEngagement,
        avgCTR: totalViews > 0 ? totalEngagement / totalViews : 0,
        trendingScore: totalViews > 0 ? Math.min(100, Math.round((totalEngagement / totalViews) * 1000)) : 0,
        viewsChange: 0,
        engagementChange: 0,
        ctrChange: 0,
        trendingChange: 0,
        audienceTargets: audience.length,
        publishedVideos: new Set(analytics.map((a) => a.renderOutputId)).size,
      },
      platformMetrics,
      topVideos,
      timeSeries: analytics.map((record) => ({
        date: record.createdAt.slice(0, 10),
        views: record.views,
        engagement: record.likes + record.shares + record.comments,
        likes: record.likes,
        shares: record.shares,
      })),
      heatmapData: analytics.map((record) => {
        const date = new Date(record.createdAt);
        return {
          day: date.getDay(),
          hour: date.getHours(),
          value: record.views,
        };
      }),
      topAudience: audience.slice(0, 5),
      recentAnalytics: analytics.slice(0, 10),
    });
  }
}

function expressJsonMiddleware() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const express = require("express") as typeof import("express");
  return express.json();
}
