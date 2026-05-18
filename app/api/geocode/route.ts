import { NextRequest, NextResponse } from "next/server";
import { geocode } from "@/lib/geocode";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ results: [] });
  return NextResponse.json({ results: await geocode(q) });
}
