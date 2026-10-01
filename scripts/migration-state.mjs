import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function migrationsMatch(local, applied) {
  if (applied.some((row) => !row.finished_at && !row.rolled_back_at)) return false;
  const completed = new Map(applied.filter((row) => row.finished_at && !row.rolled_back_at).map((row) => [row.migration_name, row.checksum]));
  return local.every((migration) => completed.get(migration.name) === migration.checksum);
}

export async function migrationsCurrent(directory, databaseUrl) {
  const local = readdirSync(directory, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => ({
    name: entry.name,
    checksum: createHash("sha256").update(readFileSync(join(directory, entry.name, "migration.sql"))).digest("hex")
  }));
  const { PrismaClient } = await import("@prisma/client");
  const client = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    const applied = await client.$queryRaw`SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations"`;
    return migrationsMatch(local, applied);
  } catch (error) {
    if (error.code === "P2010" && error.meta?.code === "42P01") return false;
    throw error;
  } finally { await client.$disconnect(); }
}
