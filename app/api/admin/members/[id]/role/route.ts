import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateMemberRoleSchema } from "@/lib/member-roles";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth) return auth;
  const parsed = updateMemberRoleSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz üye rolü." }, { status: 400 });
  const { id } = await params;
  try {
    const member = await prisma.member.update({ where: { id }, data: { role: parsed.data.role }, select: { id: true, role: true } });
    return NextResponse.json(member);
  } catch { return NextResponse.json({ error: "Üye bulunamadı." }, { status: 404 }); }
}
