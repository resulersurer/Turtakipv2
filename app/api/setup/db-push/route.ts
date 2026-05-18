import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/lib/db-ready";

const execFileAsync = promisify(execFile);

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Production ortamında web arayüzünden schema push kapalıdır." }, { status: 403 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ ok: false, error: "Önce DATABASE_URL kaydedin." }, { status: 400 });
  }

  try {
    const prismaCli = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
    const { stdout, stderr } = await execFileAsync(process.execPath, [prismaCli, "db", "push", "--skip-generate"], {
      cwd: process.cwd(),
      env: process.env,
      timeout: 120000,
      windowsHide: true
    });
    return NextResponse.json({
      ok: true,
      message: "Prisma schema veritabanına uygulandı.",
      output: [stdout, stderr].filter(Boolean).join("\n")
    });
  } catch (error) {
    const output = typeof error === "object" && error && "stdout" in error ? `${(error as { stdout?: string }).stdout || ""}\n${(error as { stderr?: string }).stderr || ""}` : "";
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Prisma db push başarısız.",
        output
      },
      { status: 500 }
    );
  }
}
