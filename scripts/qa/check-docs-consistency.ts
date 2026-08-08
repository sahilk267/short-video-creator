/**
 * check-docs-consistency.ts
 *
 * Verifies the documentation has not drifted from the source of truth:
 *   1. Every documented `METHOD /api/...` endpoint in docs/API.md exists in source.
 *   2. The router count in docs/SYSTEM_MAP.md matches the actual registered routers.
 *   3. All AUTO-GENERATED marker sections are up to date (match a fresh regeneration).
 *   4. codebase-index.json reflects the current source.
 *
 * Exit code 1 on any inconsistency.
 * Run: npx ts-node scripts/qa/check-docs-consistency.ts
 */
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, logFinding, type Finding } from "./lib";
import { extractEndpoints, extractRouterCount, renderApiBlock, renderRouterBlock, renderStoreBlock, readMarkerSection } from "./docs-lib";
import { buildIndex, renderIndexMd } from "./index-lib";

function normalize(p: string): string {
  return p.replace(/\{[^}]+\}/g, ":p").replace(/:[A-Za-z_][A-Za-z0-9_]*/g, ":p").replace(/\/+$/, "");
}

/** Drop timestamp/commit lines so time-of-run never causes a false drift signal. */
function stripVolatile(md: string): string {
  return md
    .split("\n")
    .filter((l) => !/^> Generated:/.test(l) && !/^> Last generated:/.test(l) && !/^> For commit:/.test(l))
    .join("\n");
}

function main(): void {
  const findings: Finding[] = [];
  const endpoints = extractEndpoints();
  const sourceSet = new Set(endpoints.map((e) => `${e.method} ${normalize(e.path)}`));

  const apiDoc = fs.readFileSync(path.join(REPO_ROOT, "docs", "API.md"), "utf-8");
  const docEndpoints = [...apiDoc.matchAll(/^####\s+`([A-Z]+)\s+(\/api\/[^`]+)`/gm)].map((m) => `${m[1]} ${normalize(m[2])}`);

  for (const docEp of new Set(docEndpoints)) {
    if (!sourceSet.has(docEp)) {
      const [method, ...rest] = docEp.split(" ");
      findings.push({ file: "docs/API.md", severity: "error", message: `documented endpoint ${method} ${rest.join(" ")} not found in source` });
    }
  }

  const count = extractRouterCount();
  const freshApi = renderApiBlock(endpoints);
  const freshRouter = renderRouterBlock(endpoints, count);
  const freshStore = renderStoreBlock(buildIndex().stores);

  const apiMarker = readMarkerSection("docs/API.md", "api-endpoints");
  if (apiMarker === null) {
    findings.push({ file: "docs/API.md", severity: "error", message: "missing AUTO-GENERATED api-endpoints section" });
  } else if (apiMarker !== freshApi) {
    findings.push({ file: "docs/API.md", severity: "error", message: "api-endpoints section is stale — run generate-docs" });
  }

  const mapSection = readMarkerSection("docs/SYSTEM_MAP.md", "router-inventory");
  if (mapSection === null) {
    findings.push({ file: "docs/SYSTEM_MAP.md", severity: "error", message: "missing AUTO-GENERATED router-inventory section" });
  } else if (mapSection !== freshRouter) {
    findings.push({ file: "docs/SYSTEM_MAP.md", severity: "error", message: "router-inventory section is stale — run generate-docs" });
  }

  const dbMarker = readMarkerSection("docs/DATABASE_SCHEMA.md", "store-inventory");
  if (dbMarker === null) {
    findings.push({ file: "docs/DATABASE_SCHEMA.md", severity: "error", message: "missing AUTO-GENERATED store-inventory section" });
  } else if (dbMarker !== freshStore) {
    findings.push({ file: "docs/DATABASE_SCHEMA.md", severity: "error", message: "store-inventory section is stale — run generate-docs" });
  }

  // codebase-index.json freshness
  const idx = buildIndex();
  const jsonPath = path.join(REPO_ROOT, "codebase-index.json");
  if (fs.existsSync(jsonPath)) {
    const onDisk = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    if (onDisk.summary?.files !== idx.summary.files || onDisk.summary?.endpoints !== idx.summary.endpoints) {
      findings.push({ file: "codebase-index.json", severity: "error", message: "stale index — run generate-index" });
    }
  } else {
    findings.push({ file: "codebase-index.json", severity: "error", message: "missing codebase-index.json — run generate-index" });
  }

  const mdPath = path.join(REPO_ROOT, "docs", "INDEX.md");
  if (!fs.existsSync(mdPath)) {
    findings.push({ file: "docs/INDEX.md", severity: "error", message: "missing docs/INDEX.md — run generate-index" });
  } else {
    const fresh = renderIndexMd(idx);
    const onDiskMd = fs.readFileSync(mdPath, "utf-8");
    if (stripVolatile(onDiskMd) !== stripVolatile(fresh)) {
      findings.push({ file: "docs/INDEX.md", severity: "error", message: "stale index markdown — run generate-index" });
    }
  }

  for (const f of findings) logFinding(f);
  const errors = findings.filter((f) => f.severity === "error").length;
  console.log(`\ncheck-docs-consistency: ${errors} error(s).`);
  if (errors > 0) {
    console.log("✗ check-docs-consistency FAILED\n");
    process.exit(1);
  }
  console.log("✓ check-docs-consistency passed.\n");
}

main();
