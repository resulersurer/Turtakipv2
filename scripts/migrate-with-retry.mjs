import { spawnSync } from "node:child_process";
import { setTimeout } from "node:timers/promises";

export function migrationEnvironment(environment) {
  if (!environment.DATABASE_URL) return { ...environment };
  const url = new URL(environment.DATABASE_URL);
  // Neon poolers use transaction pooling; migrations need session-scoped locks.
  if (url.hostname.endsWith(".neon.tech") && url.hostname.split(".")[0].endsWith("-pooler")) {
    url.hostname = url.hostname.replace(/-pooler(?=\.)/, "");
    url.searchParams.delete("pgbouncer");
    return { ...environment, DATABASE_URL: url.toString() };
  }
  return { ...environment };
}

export async function migrateWithRetry(prismaCli, {
  execute = spawnSync,
  environment = process.env,
  wait = setTimeout,
  stdout = process.stdout,
  stderr = process.stderr
} = {}) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const result = execute(process.execPath, [prismaCli, "migrate", "deploy"], {
      env: migrationEnvironment(environment),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
    if (result.stdout) stdout.write(result.stdout);
    if (result.stderr) stderr.write(result.stderr);
    if (result.error || result.status === 0) return result;

    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    // Retry only lock acquisition timeouts, never a failed migration or SQL error.
    const lockTimeout = /\bP1002\b/.test(output) &&
      /Timed out trying to acquire a postgres advisory lock/i.test(output);
    if (!lockTimeout || attempt === 3) return result;

    const delay = attempt * 5000;
    stderr.write(`Migration lock is busy. Retrying in ${delay / 1000}s (${attempt + 1}/3).\n`);
    await wait(delay);
  }
}
