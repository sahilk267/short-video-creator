/**
 * Shared utilities for the QA / auto-indexing scripts.
 * Run with: npx ts-node scripts/qa/<script>.ts
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const REPO_ROOT = path.resolve(__dirname, "../..");

export const SRC_DIR = path.join(REPO_ROOT, "src");
export const DOCS_DIR = path.join(REPO_ROOT, "docs");
export const QA_DIR = path.join(REPO_ROOT, "scripts", "qa");

export type Severity = "error" | "warning";

export interface Finding {
  file: string;
  line?: number;
  severity: Severity;
  message: string;
}

export function walk(dir: string, exts: string[], out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, exts, out);
    } else if (exts.includes(path.extname(entry.name)) && !entry.name.endsWith(".d.ts")) {
      out.push(full);
    }
  }
  return out;
}

export function rel(abs: string): string {
  return path.relative(REPO_ROOT, abs).split(path.sep).join("/");
}

export function readFile(relPath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf-8");
}

export function writeFile(relPath: string, content: string): void {
  fs.writeFileSync(path.join(REPO_ROOT, relPath), content, "utf-8");
}

export function fileExists(relPath: string): boolean {
  return fs.existsSync(path.join(REPO_ROOT, relPath));
}

export function logFinding(f: Finding): void {
  const loc = f.file + (f.line ? `:${f.line}` : "");
  console.log(`[${f.severity.toUpperCase()}] ${loc} — ${f.message}`);
}

export function reportAndExit(name: string, findings: Finding[], hardFail: boolean): number {
  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");
  for (const f of findings) logFinding(f);

  console.log(`\n${name}: ${errors.length} error(s), ${warnings.length} warning(s).`);
  if (hardFail && errors.length > 0) {
    console.log(`✗ ${name} FAILED\n`);
    process.exit(1);
  }
  console.log(`✓ ${name} ${errors.length === 0 ? "passed" : "reported errors"}.\n`);
  return errors.length;
}

/** Parse the first JSDoc / header comment of a source file into a one-line responsibility. */
export function firstDocblock(source: string): string {
  const match = source.match(/\/\*\*([\s\S]*?)\*\//) || source.match(/^\s*\/\/\s*(.+)$/m);
  if (!match) return "";
  const clean = match[1]
    .replace(/^[\s*]+|[\s*]+$/g, "")
    .split("\n")
    .map((l) => l.replace(/^\s*\*\s?/, "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return clean.slice(0, 200);
}

export function runCommand(cmd: string, cwd = REPO_ROOT): { code: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("bash", ["-lc", cmd], { cwd, encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 });
    return { code: 0, stdout, stderr: "" };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
  }
}
