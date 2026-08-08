/**
 * index-lib.ts — shared logic for the self-updating codebase index.
 * Produces codebase-index.json + docs/INDEX.md from the live source tree.
 */
import path from "node:path";
import { SRC_DIR, walk, rel, readFile, firstDocblock } from "./lib";
import { extractEndpoints } from "./docs-lib";

export interface IndexFile {
  path: string;
  type: string;
  responsibility: string;
  exports: string[];
}

export interface IndexRoute {
  method: string;
  path: string;
  router: string;
  referenced: string[];
}

export interface IndexPage {
  route: string;
  component: string;
  file: string;
  apiCalls: string[];
}

export interface IndexStore {
  file: string;
  class: string;
  jsonFile: string;
  purpose: string;
}

export interface CodebaseIndex {
  commit: string;
  summary: { files: number; endpoints: number; pages: number; stores: number };
  files: IndexFile[];
  apiRoutes: IndexRoute[];
  pages: IndexPage[];
  stores: IndexStore[];
}

function classifyType(fileRel: string): string {
  if (fileRel.startsWith("src/db/")) return "db";
  if (fileRel.startsWith("src/server/routers/")) return "router";
  if (fileRel.startsWith("src/server/")) return "server";
  if (fileRel.startsWith("src/ui/pages/")) return "page";
  if (fileRel.startsWith("src/ui/")) return "ui";
  if (fileRel.includes("Engine")) return "engine";
  if (fileRel.includes("Service")) return "service";
  if (fileRel.includes("Publisher")) return "publisher";
  if (fileRel.includes("Store")) return "store";
  if (fileRel.startsWith("src/publishers/")) return "publisher";
  if (fileRel.startsWith("src/types/")) return "types";
  if (fileRel.startsWith("src/config")) return "config";
  return "module";
}

function extractExports(content: string): string[] {
  const out = new Set<string>();
  const re = /export\s+(?:default\s+)?(?:abstract\s+)?(?:class|const|function|interface|type|enum|async\s+function)\s+([A-Za-z0-9_]+)/g;
  for (const m of content.matchAll(re)) out.add(m[1]);
  return [...out].sort();
}

export function buildIndex(commit = "unknown"): CodebaseIndex {
  const srcFiles = walk(SRC_DIR, [".ts", ".tsx"]).map(rel).sort();

  const files: IndexFile[] = [];
  for (const f of srcFiles) {
    if (/(\.test|\.spec)\.(ts|tsx)$/.test(f)) continue;
    const content = readFile(f);
    files.push({ path: f, type: classifyType(f), responsibility: firstDocblock(content), exports: extractExports(content) });
  }

  const routes = buildRoutes();
  const pages = buildPages();
  const stores = buildStores();

  return {
    commit,
    summary: { files: files.length, endpoints: routes.length, pages: pages.length, stores: stores.length },
    files,
    apiRoutes: routes,
    pages,
    stores,
  };
}

function buildRoutes(): IndexRoute[] {
  const routes = extractEndpoints();
  return routes.map((r) => {
    const routerFile = `src/server/routers/${r.router.replace(/Router$/, "").toLowerCase()}.ts`;
    const referenced: string[] = [];
    try {
      const content = readFile(routerFile);
      const classes = new Set<string>();
      const re = /(?:new|instanceof|extends|implements|:\s*)\s*([A-Z][A-Za-z0-9_]+)/g;
      for (const m of content.matchAll(re)) {
        const name = m[1];
        if (/(Router|Request|Response|Config|Promise|Array|Error|Buffer)$/.test(name)) continue;
        if (name.length > 3) classes.add(name);
      }
      referenced.push(...[...classes].sort());
    } catch {
      /* ignore */
    }
    return { method: r.method, path: r.path, router: r.router, referenced };
  });
}

function buildPages(): IndexPage[] {
  const appContent = readFile("src/ui/App.tsx");
  const pages: IndexPage[] = [];
  const routeRe = /<Route path="([^"]+)" element=\{<([A-Za-z0-9_]+)\s*\/>/g;
  for (const m of appContent.matchAll(routeRe)) {
    const [route, component] = [m[1], m[2]];
    const file = findComponentFile(component);
    const apiCalls: string[] = [];
    if (file) {
      const content = readFile(file);
      const seen = new Set<string>();
      for (const api of content.matchAll(/["'`](\/api\/[A-Za-z0-9_${}/:.?-]+)["'`]/g)) {
        const clean = api[1].replace(/\$\{[^}]+\}/g, ":id").replace(/:[a-zA-Z_]+/g, ":p");
        if (!seen.has(clean)) {
          seen.add(clean);
          apiCalls.push(clean);
        }
      }
    }
    pages.push({ route, component, file: file || "?", apiCalls: apiCalls.slice(0, 25) });
  }
  return pages;
}

function findComponentFile(component: string): string | null {
  const pagesDir = path.join(SRC_DIR, "ui", "pages");
  for (const f of walk(pagesDir, [".tsx"])) {
    const content = readFile(rel(f));
    if (new RegExp(`(export default|export function|export const)\\s+${component}\\b`).test(content)) {
      return rel(f);
    }
  }
  return null;
}

function buildStores(): IndexStore[] {
  const stores: IndexStore[] = [];
  const dbDir = path.join(SRC_DIR, "db");
  for (const f of walk(dbDir, [".ts"])) {
    const fileRel = rel(f);
    if (/\.test\.ts$/.test(fileRel)) continue;
    const content = readFile(fileRel);
    const cls = content.match(/export class ([A-Za-z0-9_]+)/)?.[1] ?? "";
    const jsonFile = content.match(/["'`]((?:[A-Za-z0-9_-]+\.json)+)["'`]/)?.[1] ?? "";
    stores.push({ file: fileRel, class: cls, jsonFile, purpose: firstDocblock(content) });
  }
  return stores;
}

export function renderIndexMd(idx: CodebaseIndex): string {
  const lines: string[] = [
    "# Codebase Index (auto-generated)",
    "",
    `> For commit: \`${idx.commit}\` · ${idx.summary.files} source files · ${idx.summary.endpoints} API endpoints · ${idx.summary.pages} pages · ${idx.summary.stores} stores`,
    "",
    "## Files",
    "",
    "| File | Type | Responsibility | Exports |",
    "|------|------|----------------|---------|",
  ];
  for (const f of idx.files) {
    lines.push(`| \`${f.path}\` | ${f.type} | ${(f.responsibility || "-").replace(/\|/g, "\\|").slice(0, 120)} | ${f.exports.join(", ") || "-"} |`);
  }

  lines.push("", "## API Routes", "", "| Method | Path | Router |", "|--------|------|--------|");
  for (const r of idx.apiRoutes) {
    lines.push(`| \`${r.method}\` | \`${r.path}\` | ${r.router} |`);
  }

  lines.push("", "## UI Pages", "", "| Route | Component | File | API Calls |", "|-------|-----------|------|-----------|");
  for (const p of idx.pages) {
    lines.push(`| \`${p.route}\` | ${p.component} | \`${p.file}\` | ${p.apiCalls.map((c) => `\`${c}\``).join(" · ") || "-"} |`);
  }

  lines.push("", "## Data Stores", "", "| File | Class | JSON File | Purpose |", "|------|-------|-----------|---------|");
  for (const s of idx.stores) {
    lines.push(`| \`${s.file}\` | ${s.class || "-"} | \`${s.jsonFile}\` | ${(s.purpose || "-").replace(/\|/g, "\\|").slice(0, 120)} |`);
  }
  lines.push("");
  return lines.join("\n");
}
