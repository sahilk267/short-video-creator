#!/usr/bin/env node
/**
 * Seeder 001 – Seed default data
 *
 * Populates the data stores with:
 *   - Default category mappings
 *   - Sample hook templates
 *   - Default branding themes
 *   - Sample video library entries (for demo)
 *
 * Safe to run multiple times (idempotent — checks existing data).
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

require("dotenv").config();
const DATA_DIR = process.env.DATA_DIR_PATH || path.join(os.homedir(), ".ai-content-empire");

function readJson(filePath, fallback) {
  try {
    const content = fs.readFileSync(filePath, "utf-8").trim();
    return content ? JSON.parse(content) : fallback;
  } catch { return fallback; }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function cuid() {
  return `seed_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

console.log("\n🌱 Seeder 001 – Default Data");
console.log(`   Data directory: ${DATA_DIR}\n`);

// ── Seed: Category Mappings ───────────────────────────────────
const mappingsPath = path.join(DATA_DIR, "categoryMappings.json");
let mappings = readJson(mappingsPath, []);
if (mappings.length === 0) {
  mappings = [
    { id: cuid(), name: "Technology", youtubeCategory: "28", tiktokCategory: "tech", searchTerms: ["technology", "AI", "software", "coding", "gadgets"], createdAt: new Date().toISOString() },
    { id: cuid(), name: "Business", youtubeCategory: "25", tiktokCategory: "business", searchTerms: ["business", "entrepreneurship", "startup", "finance", "investing"], createdAt: new Date().toISOString() },
    { id: cuid(), name: "Motivation", youtubeCategory: "26", tiktokCategory: "motivation", searchTerms: ["motivation", "success", "mindset", "goals", "inspiration"], createdAt: new Date().toISOString() },
    { id: cuid(), name: "Health & Fitness", youtubeCategory: "17", tiktokCategory: "fitness", searchTerms: ["fitness", "workout", "health", "nutrition", "wellness"], createdAt: new Date().toISOString() },
    { id: cuid(), name: "Entertainment", youtubeCategory: "24", tiktokCategory: "entertainment", searchTerms: ["entertainment", "funny", "comedy", "viral", "trending"], createdAt: new Date().toISOString() },
    { id: cuid(), name: "Education", youtubeCategory: "27", tiktokCategory: "education", searchTerms: ["education", "learn", "tutorial", "howto", "tips"], createdAt: new Date().toISOString() },
    { id: cuid(), name: "News & Politics", youtubeCategory: "25", tiktokCategory: "news", searchTerms: ["news", "politics", "world events", "breaking", "update"], createdAt: new Date().toISOString() },
    { id: cuid(), name: "Lifestyle", youtubeCategory: "22", tiktokCategory: "lifestyle", searchTerms: ["lifestyle", "travel", "food", "fashion", "home"], createdAt: new Date().toISOString() },
  ];
  writeJson(mappingsPath, mappings);
  console.log(`  [SEED] Category mappings: ${mappings.length} entries`);
} else {
  console.log(`  [SKIP] Category mappings: ${mappings.length} already exist`);
}

// ── Seed: Hook Templates ──────────────────────────────────────
const hooksPath = path.join(DATA_DIR, "hooks.json");
let hooks = readJson(hooksPath, []);
if (hooks.length === 0) {
  hooks = [
    { id: cuid(), category: "Question Hook", template: "Did you know that {topic}?", effectiveness: 9.2, platforms: ["tiktok", "youtube", "instagram"], createdAt: new Date().toISOString() },
    { id: cuid(), category: "Controversy Hook", template: "Unpopular opinion: {statement}", effectiveness: 8.9, platforms: ["tiktok", "instagram", "twitter"], createdAt: new Date().toISOString() },
    { id: cuid(), category: "Secret Hook", template: "The secret that {authority} doesn't want you to know about {topic}", effectiveness: 8.7, platforms: ["youtube", "tiktok"], createdAt: new Date().toISOString() },
    { id: cuid(), category: "Number Hook", template: "{number} things you MUST know about {topic}", effectiveness: 8.5, platforms: ["youtube", "instagram", "linkedin"], createdAt: new Date().toISOString() },
    { id: cuid(), category: "Story Hook", template: "I was {situation} when I discovered {revelation}", effectiveness: 8.4, platforms: ["tiktok", "instagram", "youtube"], createdAt: new Date().toISOString() },
    { id: cuid(), category: "Warning Hook", template: "Stop doing {action} if you want to {goal}", effectiveness: 8.3, platforms: ["tiktok", "instagram"], createdAt: new Date().toISOString() },
    { id: cuid(), category: "Comparison Hook", template: "Why {option_a} beats {option_b} every time", effectiveness: 8.1, platforms: ["youtube", "linkedin", "twitter"], createdAt: new Date().toISOString() },
    { id: cuid(), category: "POV Hook", template: "POV: You just discovered how to {achievement}", effectiveness: 7.9, platforms: ["tiktok", "instagram"], createdAt: new Date().toISOString() },
    { id: cuid(), category: "Mistake Hook", template: "The biggest mistake people make with {topic}", effectiveness: 8.6, platforms: ["all"], createdAt: new Date().toISOString() },
    { id: cuid(), category: "Challenge Hook", template: "I tried {challenge} for {duration} and here's what happened", effectiveness: 8.2, platforms: ["tiktok", "youtube", "instagram"], createdAt: new Date().toISOString() },
  ];
  writeJson(hooksPath, hooks);
  console.log(`  [SEED] Hook templates: ${hooks.length} entries`);
} else {
  console.log(`  [SKIP] Hook templates: ${hooks.length} already exist`);
}

// ── Seed: Default Branding Config ────────────────────────────
const brandingPath = path.join(DATA_DIR, "brandingConfig.json");
let branding = readJson(brandingPath, { themes: [], defaultTheme: null });
if (branding.themes.length === 0) {
  branding = {
    defaultTheme: "default",
    themes: [
      {
        id: "default",
        name: "AI Content Empire",
        colors: { primary: "#6366f1", secondary: "#f59e0b", accent: "#22c55e", background: "#0f172a", text: "#ffffff" },
        fonts: { heading: "Inter", body: "Roboto" },
        logo: null,
        watermark: "AI Content Empire",
        createdAt: new Date().toISOString(),
      },
      {
        id: "dark-pro",
        name: "Dark Professional",
        colors: { primary: "#1d4ed8", secondary: "#dc2626", accent: "#16a34a", background: "#111827", text: "#f9fafb" },
        fonts: { heading: "Poppins", body: "Inter" },
        logo: null,
        watermark: null,
        createdAt: new Date().toISOString(),
      },
    ],
  };
  writeJson(brandingPath, branding);
  console.log(`  [SEED] Branding config: ${branding.themes.length} themes`);
} else {
  console.log(`  [SKIP] Branding config: already configured`);
}

// ── Seed: Default Custom News Sources ────────────────────────
const newsPath = path.join(DATA_DIR, "customNewsSources.json");
let news = readJson(newsPath, []);
if (news.length === 0) {
  news = [
    { id: cuid(), name: "TechCrunch", url: "https://techcrunch.com/feed/", category: "Technology", active: true, createdAt: new Date().toISOString() },
    { id: cuid(), name: "Product Hunt", url: "https://www.producthunt.com/feed", category: "Technology", active: true, createdAt: new Date().toISOString() },
    { id: cuid(), name: "Hacker News", url: "https://news.ycombinator.com/rss", category: "Technology", active: true, createdAt: new Date().toISOString() },
    { id: cuid(), name: "Forbes Business", url: "https://www.forbes.com/business/feed/", category: "Business", active: true, createdAt: new Date().toISOString() },
    { id: cuid(), name: "ESPN Sports", url: "https://www.espn.com/espn/rss/news", category: "Sports", active: false, createdAt: new Date().toISOString() },
  ];
  writeJson(newsPath, news);
  console.log(`  [SEED] News sources: ${news.length} entries`);
} else {
  console.log(`  [SKIP] News sources: ${news.length} already exist`);
}

// ── Seed: Default Tenant ──────────────────────────────────────
const tenantsPath = path.join(DATA_DIR, "tenants.json");
let tenants = readJson(tenantsPath, []);
if (tenants.length === 0) {
  tenants = [
    {
      id: "tenant_default",
      name: "Default Workspace",
      plan: "pro",
      apiKey: `ace_${Math.random().toString(36).slice(2, 18)}`,
      settings: { maxVideosPerMonth: 1000, maxStorageGB: 50, enabledPlatforms: ["youtube", "instagram", "tiktok"] },
      createdAt: new Date().toISOString(),
    },
  ];
  writeJson(tenantsPath, tenants);
  console.log(`  [SEED] Default tenant created (ID: tenant_default)`);
  console.log(`  [INFO] Default API key: ${tenants[0].apiKey}`);
} else {
  console.log(`  [SKIP] Tenants: ${tenants.length} already exist`);
}

// ── Record seeder ─────────────────────────────────────────────
const seedRecordPath = path.join(DATA_DIR, "_seeders.json");
let seeders = readJson(seedRecordPath, []);
const alreadySeeded = seeders.some(s => s.version === "001");
if (!alreadySeeded) {
  seeders.push({ version: "001", name: "seed_defaults", appliedAt: new Date().toISOString() });
  writeJson(seedRecordPath, seeders);
}

console.log("\n✅ Seeder 001 complete!\n");
