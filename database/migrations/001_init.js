#!/usr/bin/env node
/**
 * Migration 001 – Initialize all file-based data stores
 *
 * Creates the required directory structure and JSON store files
 * under DATA_DIR_PATH (or ~/.ai-content-empire by default).
 *
 * Safe to run multiple times (idempotent).
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

// ── Config ────────────────────────────────────────────────────
require("dotenv").config();
const DATA_DIR = process.env.DATA_DIR_PATH || path.join(os.homedir(), ".ai-content-empire");

// ── Helpers ───────────────────────────────────────────────────
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`  [CREATE] Directory: ${dirPath}`);
  } else {
    console.log(`  [EXISTS] Directory: ${dirPath}`);
  }
}

function ensureJsonFile(filePath, defaultContent) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), "utf-8");
    console.log(`  [CREATE] Store: ${path.basename(filePath)}`);
  } else {
    // Validate existing file is valid JSON
    try {
      JSON.parse(fs.readFileSync(filePath, "utf-8"));
      console.log(`  [EXISTS] Store: ${path.basename(filePath)}`);
    } catch {
      console.warn(`  [REPAIR] Invalid JSON in ${filePath} — resetting`);
      fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), "utf-8");
    }
  }
}

// ── Run Migration ─────────────────────────────────────────────
console.log("\n🗄️  Migration 001 – Initialize Data Stores");
console.log(`   Data directory: ${DATA_DIR}\n`);

// ── Step 1: Create directory structure ───────────────────────
const dirs = [
  DATA_DIR,
  path.join(DATA_DIR, "videos"),
  path.join(DATA_DIR, "temp"),
  path.join(DATA_DIR, "logs"),
  path.join(DATA_DIR, "generated-images"),
  path.join(DATA_DIR, "filtered-images"),
  path.join(DATA_DIR, "watermarked"),
  path.join(DATA_DIR, "thumbnails"),
  path.join(DATA_DIR, "cache"),
  path.join(DATA_DIR, "cache", "puppeteer"),
  path.join(DATA_DIR, "cache", "huggingface"),
  path.join(DATA_DIR, "exports"),
  path.join(DATA_DIR, "backups"),
];

console.log("📁 Creating directories...");
dirs.forEach(ensureDir);

// ── Step 2: Initialize JSON data stores ──────────────────────
console.log("\n📝 Initializing data stores...");

const stores = [
  // Video management
  ["videoLibrary.json", []],
  ["renderJobs.json", []],
  ["publishJobs.json", []],
  ["scriptPlans.json", []],
  ["videoMetadata.json", []],

  // Analytics & intelligence
  ["analytics.json", { events: [], aggregates: {} }],
  ["abVariants.json", []],
  ["audienceProfiles.json", []],
  ["aiLearning.json", { insights: [], models: {} }],
  ["reports.json", []],

  // Content systems
  ["hooks.json", []],
  ["schedules.json", []],
  ["customNewsSources.json", []],

  // Publishing
  ["tenants.json", []],
  ["tenantUsage.json", []],

  // Cost tracking
  ["costs.json", { records: [], totals: {} }],

  // Platform configs
  ["brandingConfig.json", { themes: [], defaultTheme: null }],
  ["webhooks.json", []],
  ["categoryMappings.json", []],
];

stores.forEach(([filename, defaultContent]) => {
  ensureJsonFile(path.join(DATA_DIR, filename), defaultContent);
});

// ── Step 3: Write migration record ───────────────────────────
const migrationRecord = {
  version: "001",
  name: "init",
  appliedAt: new Date().toISOString(),
  dataDir: DATA_DIR,
};
const migrationsPath = path.join(DATA_DIR, "_migrations.json");
let migrations = [];
if (fs.existsSync(migrationsPath)) {
  try { migrations = JSON.parse(fs.readFileSync(migrationsPath, "utf-8")); } catch {}
}
const alreadyApplied = migrations.some(m => m.version === "001");
if (!alreadyApplied) {
  migrations.push(migrationRecord);
  fs.writeFileSync(migrationsPath, JSON.stringify(migrations, null, 2), "utf-8");
  console.log("\n✅ Migration 001 recorded");
} else {
  console.log("\n⏭️  Migration 001 already applied — skipping record");
}

console.log("\n✅ Migration 001 complete!\n");
