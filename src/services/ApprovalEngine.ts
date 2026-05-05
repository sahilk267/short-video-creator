import fs from "fs-extra";
import path from "path";
import { logger } from "../logger";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "needs_revision";

export interface ApprovalItem {
  id: string;
  contentId: string;
  contentType: "video" | "image" | "caption" | "script";
  title: string;
  submittedBy: string;
  submittedAt: string;
  status: ApprovalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  comments?: string;
  checklist: ChecklistItem[];
  priority: "low" | "medium" | "high";
}

export interface ChecklistItem {
  id: string;
  label: string;
  passed: boolean;
  required: boolean;
}

const DEFAULT_CHECKLIST: Omit<ChecklistItem, "passed">[] = [
  { id: "no_hate_speech", label: "No hate speech or discriminatory content", required: true },
  { id: "no_explicit", label: "No explicit or adult content", required: true },
  { id: "no_misleading", label: "No misleading or false claims", required: true },
  { id: "has_cta", label: "Has a clear call-to-action", required: false },
  { id: "correct_aspect", label: "Correct aspect ratio for platform", required: false },
  { id: "has_captions", label: "Captions/subtitles included", required: false },
  { id: "brand_guidelines", label: "Follows brand guidelines", required: false },
  { id: "copyright_clear", label: "No copyright violations", required: true },
];

export class ApprovalEngine {
  private dataPath: string;
  private items: ApprovalItem[] = [];

  constructor(dataDirPath: string) {
    this.dataPath = path.join(dataDirPath, "approval-queue.json");
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.dataPath)) this.items = fs.readJsonSync(this.dataPath);
    } catch { this.items = []; }
  }

  private save() {
    try { fs.writeJsonSync(this.dataPath, this.items, { spaces: 2 }); } catch { /* ignore */ }
  }

  submit(contentId: string, contentType: ApprovalItem["contentType"], title: string, submittedBy: string, priority: ApprovalItem["priority"] = "medium"): ApprovalItem {
    const id = `apr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const item: ApprovalItem = {
      id, contentId, contentType, title, submittedBy,
      submittedAt: new Date().toISOString(),
      status: "pending",
      priority,
      checklist: DEFAULT_CHECKLIST.map((c) => ({ ...c, passed: false })),
    };
    this.items.push(item);
    this.save();
    logger.debug({ id, contentId }, "ApprovalEngine: item submitted");
    return item;
  }

  autoCheck(itemId: string, text?: string): ApprovalItem {
    const item = this.items.find((i) => i.id === itemId);
    if (!item) throw new Error(`Approval item ${itemId} not found`);
    const lower = (text || item.title).toLowerCase();

    item.checklist = item.checklist.map((c) => {
      let passed = c.passed;
      if (c.id === "no_hate_speech") passed = !/\b(hate|racist|sexist|slur)\b/.test(lower);
      if (c.id === "no_explicit") passed = !/\b(explicit|nude|xxx|adult)\b/.test(lower);
      if (c.id === "no_misleading") passed = !/\b(guaranteed|100%|miracle|cure|overnight)\b/.test(lower);
      if (c.id === "has_cta") passed = /\b(follow|like|share|subscribe|comment|click|watch)\b/.test(lower);
      if (c.id === "copyright_clear") passed = !/\b(copyright|©|all rights reserved)\b/.test(lower);
      return { ...c, passed };
    });

    const requiredFailed = item.checklist.filter((c) => c.required && !c.passed);
    if (requiredFailed.length === 0) {
      item.status = "approved";
      item.reviewedAt = new Date().toISOString();
      item.reviewedBy = "auto-check";
    } else {
      item.status = "needs_revision";
      item.comments = `Auto-check failed: ${requiredFailed.map((c) => c.label).join(", ")}`;
    }
    this.save();
    return item;
  }

  review(itemId: string, status: ApprovalStatus, reviewedBy: string, comments?: string): ApprovalItem {
    const item = this.items.find((i) => i.id === itemId);
    if (!item) throw new Error(`Approval item ${itemId} not found`);
    item.status = status;
    item.reviewedBy = reviewedBy;
    item.reviewedAt = new Date().toISOString();
    if (comments) item.comments = comments;
    this.save();
    logger.debug({ itemId, status }, "ApprovalEngine: reviewed");
    return item;
  }

  updateChecklist(itemId: string, checks: Record<string, boolean>): ApprovalItem {
    const item = this.items.find((i) => i.id === itemId);
    if (!item) throw new Error(`Approval item ${itemId} not found`);
    item.checklist = item.checklist.map((c) => checks[c.id] !== undefined ? { ...c, passed: checks[c.id] } : c);
    this.save();
    return item;
  }

  getPending(): ApprovalItem[] { return this.items.filter((i) => i.status === "pending"); }
  getAll(): ApprovalItem[] { return this.items; }
  getById(id: string): ApprovalItem | undefined { return this.items.find((i) => i.id === id); }

  getStats() {
    return {
      total: this.items.length,
      pending: this.items.filter((i) => i.status === "pending").length,
      approved: this.items.filter((i) => i.status === "approved").length,
      rejected: this.items.filter((i) => i.status === "rejected").length,
      needsRevision: this.items.filter((i) => i.status === "needs_revision").length,
    };
  }
}
