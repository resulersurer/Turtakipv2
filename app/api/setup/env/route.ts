import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const schema = z.object({
  databaseUrl: z.string().trim().min(10).startsWith("postgresql://"),
  adminPassword: z.string().min(6),
  adminCookieSecret: z.string().min(24)
});

function upsertEnv(content: string, values: Record<string, string>) {
  const lines = content.split(/\r?\n/);
  const seen = new Set<string>();
  const updated = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (!match || !(match[1] in values)) return line;
    seen.add(match[1]);
    return `${match[1]}=${JSON.stringify(values[match[1]])}`;
  });
  for (const [key, value] of Object.entries(values)) {
    if (!seen.has(key)) updated.push(`${key}=${JSON.stringify(value)}`);
  }
  return `${updated.filter((line, index, array) => line.trim() || index < array.length - 1).join("\n")}\n`;
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Production ortamında .env web arayüzünden yazılamaz." }, { status: 403 });
  }

  const input = schema.parse(await request.json());
  const envPath = path.join(process.cwd(), ".env");
  const current = await readFile(envPath, "utf8").catch(() => "");
  const next = upsertEnv(current, {
    DATABASE_URL: input.databaseUrl,
    ADMIN_PASSWORD: input.adminPassword,
    ADMIN_COOKIE_SECRET: input.adminCookieSecret
  });

  await writeFile(envPath, next, "utf8");

  process.env.DATABASE_URL = input.databaseUrl;
  process.env.ADMIN_PASSWORD = input.adminPassword;
  process.env.ADMIN_COOKIE_SECRET = input.adminCookieSecret;

  return NextResponse.json({
    ok: true,
    message: ".env kaydedildi. Bu çalışan local süreçte değerler etkinleştirildi; sorun görürseniz dev server'ı yeniden başlatın."
  });
}
