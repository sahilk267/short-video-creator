import fs from "fs-extra";
import path from "path";
import { logger } from "../logger";

export type ErrorCategory = "render" | "publish" | "tts" | "asset_fetch" | "export" | "api" | "general";
export type RecoveryStatus = "queued" | "retrying" | "recovered" | "dead" | "abandoned";

export interface ErrorEvent {
  id: string;
  category: ErrorCategory;
  message: string;
  stack?: string;
  context: Record<string, unknown>;
  tenantId?: string;
  occurredAt: string;
  retryCount: number;
  maxRetries: number;
  status: RecoveryStatus;
  lastRetryAt?: string;
  resolvedAt?: string;
  resolution?: string;
  nextRetryAt?: string;
}

export interface RecoveryStrategy {
  category: ErrorCategory;
  maxRetries: number;
  backoffMs: number[];
  autoRecover: boolean;
  escalateAfter: number;
}

const STRATEGIES: Record<ErrorCategory, RecoveryStrategy> = {
  render: { category: "render", maxRetries: 3, backoffMs: [5000, 15000, 60000], autoRecover: true, escalateAfter: 2 },
  publish: { category: "publish", maxRetries: 5, backoffMs: [10000, 30000, 60000, 300000, 600000], autoRecover: true, escalateAfter: 3 },
  tts: { category: "tts", maxRetries: 2, backoffMs: [3000, 10000], autoRecover: true, escalateAfter: 2 },
  asset_fetch: { category: "asset_fetch", maxRetries: 4, backoffMs: [2000, 5000, 15000, 60000], autoRecover: true, escalateAfter: 3 },
  export: { category: "export", maxRetries: 2, backoffMs: [5000, 30000], autoRecover: false, escalateAfter: 1 },
  api: { category: "api", maxRetries: 3, backoffMs: [1000, 5000, 30000], autoRecover: true, escalateAfter: 2 },
  general: { category: "general", maxRetries: 2, backoffMs: [5000, 30000], autoRecover: false, escalateAfter: 1 },
};

export class ErrorRecoveryEngine {
  private dataPath: string;
  private events: ErrorEvent[] = [];

  constructor(dataDirPath: string) {
    this.dataPath = path.join(dataDirPath, "error-recovery.json");
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.dataPath)) this.events = fs.readJsonSync(this.dataPath);
    } catch { this.events = []; }
  }

  private save() {
    try {
      if (this.events.length > 10000) this.events = this.events.slice(-8000);
      fs.writeJsonSync(this.dataPath, this.events, { spaces: 2 });
    } catch { /* ignore */ }
  }

  recordError(
    category: ErrorCategory,
    message: string,
    context: Record<string, unknown> = {},
    opts: { tenantId?: string; stack?: string } = {}
  ): ErrorEvent {
    const strategy = STRATEGIES[category];
    const event: ErrorEvent = {
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      category, message, context,
      stack: opts.stack,
      tenantId: opts.tenantId,
      occurredAt: new Date().toISOString(),
      retryCount: 0, maxRetries: strategy.maxRetries,
      status: "queued",
      nextRetryAt: new Date(Date.now() + strategy.backoffMs[0]).toISOString(),
    };

    this.events.push(event);
    this.save();
    logger.warn({ id: event.id, category, message }, "ErrorRecoveryEngine: error recorded");
    return event;
  }

  markRetrying(errorId: string): ErrorEvent | undefined {
    const event = this.events.find((e) => e.id === errorId);
    if (!event) return undefined;
    const strategy = STRATEGIES[event.category];
    event.status = "retrying";
    event.retryCount++;
    event.lastRetryAt = new Date().toISOString();
    const backoffIdx = Math.min(event.retryCount, strategy.backoffMs.length - 1);
    event.nextRetryAt = new Date(Date.now() + strategy.backoffMs[backoffIdx]).toISOString();
    this.save();
    return event;
  }

  markRecovered(errorId: string, resolution?: string): ErrorEvent | undefined {
    const event = this.events.find((e) => e.id === errorId);
    if (!event) return undefined;
    event.status = "recovered";
    event.resolvedAt = new Date().toISOString();
    event.resolution = resolution || "Auto-recovered";
    this.save();
    logger.info({ errorId, resolution }, "ErrorRecoveryEngine: error recovered");
    return event;
  }

  markDead(errorId: string, reason?: string): ErrorEvent | undefined {
    const event = this.events.find((e) => e.id === errorId);
    if (!event) return undefined;
    event.status = "dead";
    event.resolution = reason || `Max retries (${event.maxRetries}) exceeded`;
    this.save();
    logger.error({ errorId, category: event.category }, "ErrorRecoveryEngine: error moved to dead letter");
    return event;
  }

  processDeadLetter(): ErrorEvent[] {
    const now = Date.now();
    const queued = this.events.filter((e) => e.status === "queued" && e.nextRetryAt && new Date(e.nextRetryAt).getTime() <= now);

    for (const event of queued) {
      if (event.retryCount >= event.maxRetries) {
        this.markDead(event.id);
      } else {
        this.markRetrying(event.id);
      }
    }

    return queued;
  }

  getDeadLetterQueue(): ErrorEvent[] { return this.events.filter((e) => e.status === "dead"); }
  getQueuedRetries(): ErrorEvent[] { return this.events.filter((e) => e.status === "queued"); }
  getAll(limit = 200): ErrorEvent[] { return this.events.slice(-limit).reverse(); }

  getStats() {
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    for (const e of this.events) {
      byStatus[e.status] = (byStatus[e.status] || 0) + 1;
      byCategory[e.category] = (byCategory[e.category] || 0) + 1;
    }
    return { total: this.events.length, byStatus, byCategory, deadLetterCount: this.events.filter((e) => e.status === "dead").length };
  }

  clearResolved(): number {
    const before = this.events.length;
    this.events = this.events.filter((e) => e.status !== "recovered");
    this.save();
    return before - this.events.length;
  }
}
