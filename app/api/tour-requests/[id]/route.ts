import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTourRequestSchema } from "@/lib/tour-requests";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth) return auth;
  const parsed = updateTourRequestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
  const { id } = await params;
  try {
    const item = await prisma.tourRequest.update({
      where: { id },
      data: { status: parsed.data.status, contactedAt: parsed.data.status === "CONTACTED" ? new Date() : undefined },
      select: { id: true, status: true }
    });
    return NextResponse.json(item);
  } catch { return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 }); }
}
