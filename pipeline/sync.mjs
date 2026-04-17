import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const generatedDir = path.join(repoRoot, "pipeline", "out", "generated");
const targets = [
  path.join(repoRoot, "src", "data", "verified"),
  path.join(repoRoot, "public", "data", "verified")
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyJsonFiles(fromDir, toDir) {
  ensureDir(toDir);
  const files = fs.readdirSync(fromDir).filter((name) => name.endsWith(".json"));
  for (const file of files) {
    fs.copyFileSync(path.join(fromDir, file), path.join(toDir, file));
  }
  return files;
}

if (!fs.existsSync(generatedDir)) {
  console.error(`Generated directory not found: ${generatedDir}`);
  process.exit(1);
}

for (const target of targets) {
  const files = copyJsonFiles(generatedDir, target);
  console.log(`Synced ${files.length} files to ${target}`);
}
