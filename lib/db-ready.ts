import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export async function isDatabaseSchemaReady() {
  if (!hasDatabaseUrl()) return false;
  try {
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      select to_regclass('public."Tour"') is not null as exists
    `;
    return Boolean(result[0]?.exists);
  } catch {
    return false;
  }
}

export function databaseMissingResponse() {
  return NextResponse.json(
    {
      error: "DATABASE_URL is not configured",
      message: "PostgreSQL bağlantı adresini .env dosyasına ekleyip Prisma migration çalıştırın."
    },
    { status: 503 }
  );
}

export function databaseSchemaMissingResponse() {
  return NextResponse.json(
    {
      error: "Database schema is not initialized",
      message: "/setup ekranından Prisma db push çalıştırarak tabloları oluşturun."
    },
    { status: 503 }
  );
}
