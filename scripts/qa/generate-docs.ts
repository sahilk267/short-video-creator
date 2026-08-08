/**
 * generate-docs.ts
 *
 * Regenerates the AUTO-GENERATED marker sections of the documentation so the
 * docs never drift from the actual source:
 *   - docs/API.md          -> API endpoint inventory table
 *   - docs/SYSTEM_MAP.md   -> router count + API endpoint inventory
 *   - docs/DATABASE_SCHEMA.md -> (optional) store listing
 *
 * Hand-written prose around the markers is preserved.
 * Run: npx ts-node scripts/qa/generate-docs.ts
 */
import { extractEndpoints, extractRouterCount, renderApiBlock, renderRouterBlock, renderStoreBlock, replaceMarkerSection } from "./docs-lib";
import { buildIndex } from "./index-lib";

function main(): void {
  const endpoints = extractEndpoints();
  const count = extractRouterCount();

  // API.md — endpoint inventory after the intro
  replaceMarkerSection("docs/API.md", "api-endpoints", renderApiBlock(endpoints), "---");

  // SYSTEM_MAP.md — router count
  replaceMarkerSection("docs/SYSTEM_MAP.md", "router-inventory", renderRouterBlock(endpoints, count));

  // DATABASE_SCHEMA.md — store file listing (from index)
  const idx = buildIndex();
  replaceMarkerSection("docs/DATABASE_SCHEMA.md", "store-inventory", renderStoreBlock(idx.stores));

  console.log(`generate-docs: ${endpoints.length} endpoints, ${count} routers, ${idx.stores.length} stores.`);
}

main();
