const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const seedPairs = [
  ["/app/cache/puppeteer", process.env.PUPPETEER_CACHE_DIR || "/app/data/cache/puppeteer"],
  ["/app/cache/huggingface", process.env.HF_HOME || "/app/data/cache/huggingface"],
];

function ensureEspeakDataPath() {
  const expectedPath = "/usr/share/espeak-ng-data";
  const canonicalPath = "/usr/lib/x86_64-linux-gnu/espeak-ng-data";

  if (!process.env.ESPEAK_DATA_PATH && fs.existsSync(canonicalPath)) {
    process.env.ESPEAK_DATA_PATH = canonicalPath;
  }

  if (!fs.existsSync(expectedPath) && fs.existsSync(canonicalPath)) {
    fs.mkdirSync(path.dirname(expectedPath), { recursive: true });
    fs.symlinkSync(canonicalPath, expectedPath, "dir");
    console.log(`[docker-entrypoint] Linked eSpeak data path ${expectedPath} -> ${canonicalPath}`);
  }
}

function copyDirectoryIfMissing(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    return;
  }

  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    return;
  }

  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });
  console.log(`[docker-entrypoint] Seeded cache from ${sourceDir} -> ${targetDir}`);
}

for (const [sourceDir, targetDir] of seedPairs) {
  copyDirectoryIfMissing(sourceDir, targetDir);
}

ensureEspeakDataPath();

const child = spawn("node", ["dist/index.js"], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
