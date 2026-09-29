import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { automaticImportWorkflow } from "@/workflows/import-sync";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const source = new URL(request.url).searchParams.get("source") || undefined;
    const run = await start(automaticImportWorkflow, ["CRON", source]);
    return NextResponse.json({ ok: true, runId: run.runId }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Senkronizasyon başarısız." }, { status: 500 });
  }
}
