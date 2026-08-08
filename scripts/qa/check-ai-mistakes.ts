/**
 * check-ai-mistakes.ts
 *
 * Scans the codebase for the mistakes AI coding agents most commonly leave behind:
 *   - hardcoded secrets / placeholder tokens
 *   - `@ts-ignore` / `@ts-nocheck` / `@ts-expect-error` bypasses
 *   - stray `console.log` in app source
 *   - TODO / FIXME / HACK markers
 *   - duplicate React route registrations
 *
 * Allowlist: scripts/qa/allowlist.json (pre-existing, intentionally known occurrences).
 *
 * Exit code 1 on any error-severity finding. Run: npx ts-node scripts/qa/check-ai-mistakes.ts
 */
import fs from "node:fs";
import path from "node:path";
import { SRC_DIR, QA_DIR, walk, rel, logFinding, type Finding } from "./lib";

const ALLOWLIST_PATH = path.join(QA_DIR, "allowlist.json");

interface Allowlist {
  [category: string]: { files: string[]; lines: string[] };
}

function loadAllowlist(): Allowlist {
  return JSON.parse(fs.readFileSync(ALLOWLIST_PATH, "utf-8")) as Allowlist;
}

function isAllowed(list: Allowlist, category: string, fileRel: string, line: number): boolean {
  const entry = list[category];
  if (!entry) return false;
  if (entry.files.includes(fileRel)) return true;
  if (entry.lines.includes(`${fileRel}:${line}`)) return true;
  return false;
}

// [category, name, regex, errorSeverity]
const SECRET_PATTERNS: Array<[string, string, RegExp, boolean]> = [
  ["secrets", "GitHub token", /(ghp_|gho_|ghu_|ghs_|github_pat_)[A-Za-z0-9_]{20,}/, true],
  ["secrets", "OpenAI/OpenRouter API key", /sk-[A-Za-z0-9]{24,}/, true],
  ["secrets", "Google API key", /AIza[0-9A-Za-z_-]{30,}/, true],
  ["secrets", "AWS access key", /AKIA[0-9A-Z]{16}/, true],
  ["secrets", "Slack token", /xox[baprs]-[A-Za-z0-9-]{10,}/, true],
  ["secrets", "JWT secret", /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/, true],
  ["placeholder", "placeholder token", /sk-or-placeholder|your[-_](api[-_])?key|your[-_]token|replace[-_]me|paste[-_]your|PUT_YOUR_|PASTE_YOUR_/i, true],
];

const TS_BYPASS = /@ts-ignore|@ts-nocheck|@ts-expect-error/;
const CONSOLE_LOG = /console\.log\(/;
const TODO_MARKER = /\b(TODO|FIXME|HACK)\b/;

function main(): void {
  const findings: Finding[] = [];
  const allowlist = loadAllowlist();

  const files = walk(SRC_DIR, [".ts", ".tsx"]);

  for (const abs of files) {
    const fileRel = rel(abs);
    const isTest = /\.test\.(ts|tsx)$/.test(fileRel);
    const lines = fs.readFileSync(abs, "utf-8").split("\n");

    lines.forEach((line, idx) => {
      const lineNo = idx + 1;

      // Secrets (skip test files — they legitimately contain dummy values)
      if (!isTest) {
        for (const [category, name, re, hard] of SECRET_PATTERNS) {
          if (re.test(line)) {
            if (!isAllowed(allowlist, category, fileRel, lineNo)) {
              findings.push({
                file: fileRel,
                line: lineNo,
                severity: hard ? "error" : "warning",
                message: `possible ${name} (never commit real credentials)`,
              });
            }
            break;
          }
        }
      }

      // Type bypasses
      if (TS_BYPASS.test(line) && !isAllowed(allowlist, "ts-bypass", fileRel, lineNo)) {
        findings.push({
          file: fileRel,
          line: lineNo,
          severity: "error",
          message: "TypeScript bypass (@ts-ignore/@ts-nocheck/@ts-expect-error) — fix the type instead",
        });
      }

      // Stray console.log in app source
      if (CONSOLE_LOG.test(line) && !isTest && !isAllowed(allowlist, "console.log", fileRel, lineNo)) {
        findings.push({
          file: fileRel,
          line: lineNo,
          severity: "error",
          message: "stray console.log — use the pino logger or remove it",
        });
      }

      // TODO / FIXME / HACK
      if (TODO_MARKER.test(line) && !isAllowed(allowlist, "todo", fileRel, lineNo)) {
        findings.push({
          file: fileRel,
          line: lineNo,
          severity: "warning",
          message: "unresolved marker left in code",
        });
      }
    });
  }

  // Duplicate React routes (the classic "duplicate control" AI bug)
  const appPath = path.join(SRC_DIR, "ui", "App.tsx");
  if (fs.existsSync(appPath)) {
    const appContent = fs.readFileSync(appPath, "utf-8");
    const paths = [...appContent.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]);
    const seen = new Set<string>();
    for (const p of paths) {
      if (seen.has(p)) {
        findings.push({
          file: "src/ui/App.tsx",
          severity: "error",
          message: `duplicate <Route path="${p}"> registration`,
        });
      }
      seen.add(p);
    }
  }

  for (const f of findings) logFinding(f);
  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;
  console.log(`\ncheck-ai-mistakes: ${errors} error(s), ${warnings} warning(s).`);
  if (errors > 0) {
    console.log("✗ check-ai-mistakes FAILED\n");
    process.exit(1);
  }
  console.log("✓ check-ai-mistakes passed.\n");
}

main();
