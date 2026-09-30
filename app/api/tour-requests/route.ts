import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMemberAuth } from "@/lib/members/auth";
import { createTourRequestSchema } from "@/lib/tour-requests";

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).host === request.nextUrl.host; } catch { return false; }
}

function safeReferrer(request: NextRequest) {
  const value = request.headers.get("referer");
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.host === request.nextUrl.host ? `${url.pathname}${url.search}`.slice(0, 500) : null;
  } catch { return null; }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Geçersiz istek." }, { status: 403 });
  try {
    const parsed = createTourRequestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Form bilgilerini kontrol edin." }, { status: 400 });
    const input = parsed.data;
    if (input.website) return NextResponse.json({ ok: true, code: "TLP-ALINDI" }, { status: 201 });

    const tour = input.tourId || input.tourSlug ? await prisma.tour.findFirst({
      where: { status: "PUBLISHED", OR: [input.tourId ? { id: input.tourId } : undefined, input.tourSlug ? { slug: input.tourSlug } : undefined].filter(Boolean) as Array<{ id: string } | { slug: string }> },
      select: { id: true, name: true, slug: true }
    }) : null;
    const auth = getMemberAuth();
    const session = auth ? await auth.api.getSession({ headers: request.headers }).catch(() => null) : null;
    const code = `TLP-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const result = await prisma.tourRequest.create({ data: {
      code,
      fullName: input.fullName,
      phone: input.phone,
      email: input.email || null,
      city: input.city || null,
      adultCount: input.adultCount,
      childCount: input.childCount,
      preferredDate: input.preferredDate ? new Date(`${input.preferredDate}T12:00:00.000Z`) : null,
      budget: input.budget || null,
      notes: input.notes || null,
      sourcePage: input.sourcePage,
      sourceLabel: input.sourceLabel || null,
      referrer: safeReferrer(request),
      utmSource: input.utmSource || null,
      utmMedium: input.utmMedium || null,
      utmCampaign: input.utmCampaign || null,
      tourId: tour?.id || null,
      tourName: tour?.name || null,
      tourSlug: tour?.slug || null,
      memberId: session?.user.id || null
    }, select: { code: true } });
    return NextResponse.json({ ok: true, code: result.code }, { status: 201 });
  } catch (error) {
    console.error("Tour request creation failed", error);
    return NextResponse.json({ error: "Talebiniz kaydedilemedi. Lütfen tekrar deneyin." }, { status: 500 });
  }
}
