import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function loadLocalEnv() {
  if (!existsSync(".env")) return;
  const content = readFileSync(".env", "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit"
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

loadLocalEnv();
const prismaCli = join(process.cwd(), "node_modules", "prisma", "build", "index.js");
const nextCli = join(process.cwd(), "node_modules", "next", "dist", "bin", "next");

run(process.execPath, [prismaCli, "generate"]);

if (process.env.DATABASE_URL) {
  run(process.execPath, [prismaCli, "migrate", "deploy"]);
} else {
  console.warn("DATABASE_URL is not set. Skipping prisma migrate deploy during build.");
}

run(process.execPath, [nextCli, "build"]);
