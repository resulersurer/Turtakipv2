import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAutomaticImportStatus } from "@/lib/import/sync";
import { start } from "workflow/api";
import { automaticImportWorkflow } from "@/workflows/import-sync";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (auth) return auth;
  return NextResponse.json(await getAutomaticImportStatus(), { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST() {
  const auth = await requireAdmin();
  if (auth) return auth;
  try {
    const run = await start(automaticImportWorkflow, ["MANUAL"]);
    return NextResponse.json({ runId: run.runId }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Senkronizasyon başlatılamadı." }, { status: 409 });
  }
}
