/**
 * generate-index.ts
 *
 * Regenerates the self-updating codebase index:
 *   - codebase-index.json  (machine-readable, for CI diffs)
 *   - docs/INDEX.md        (human-readable)
 *
 * Run: npx ts-node scripts/qa/generate-index.ts
 */
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, runCommand } from "./lib";
import { buildIndex, renderIndexMd } from "./index-lib";

function shortCommit(): string {
  const { stdout } = runCommand("git rev-parse --short HEAD");
  return stdout.trim() || "unknown";
}

function main(): void {
  const commit = shortCommit();
  const idx = buildIndex(commit);

  const jsonPath = path.join(REPO_ROOT, "codebase-index.json");
  fs.writeFileSync(jsonPath, JSON.stringify(idx, null, 2) + "\n", "utf-8");

  const md = renderIndexMd(idx);
  const mdPath = path.join(REPO_ROOT, "docs", "INDEX.md");
  fs.writeFileSync(mdPath, md, "utf-8");

  console.log(`generate-index: wrote ${idx.summary.files} files, ${idx.summary.endpoints} endpoints, ${idx.summary.pages} pages, ${idx.summary.stores} stores (${commit}).`);
}

main();
