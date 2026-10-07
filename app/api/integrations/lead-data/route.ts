import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hasValidIntegrationKey } from "@/lib/integration-auth";

export const dynamic = "force-dynamic";

const number = (value: { toNumber(): number } | null | undefined) => value?.toNumber() ?? 0;

// Authenticate each request before accessing this private server-side snapshot.
const loadLeadData = unstable_cache(async () => {
  const now = new Date();
  const [tours, reservations] = await Promise.all([
    prisma.tour.findMany({
      where: { status: "PUBLISHED", departures: { some: { startDate: { gte: now } } } },
      select: {
        id: true, name: true, slug: true,
        departures: { where: { startDate: { gte: now } }, orderBy: { startDate: "asc" }, select: { id: true, startDate: true, endDate: true, label: true } }
      },
      orderBy: { name: "asc" }
    }),
    prisma.reservation.findMany({
      where: { status: "CONFIRMED" },
      select: {
        id: true, code: true, contactName: true, contactPhone: true, contactEmail: true, seats: true, status: true, createdAt: true,
        departure: { select: { id: true, startDate: true, tour: { select: { id: true, name: true, slug: true } } } },
        finance: { select: { totalAmount: true, currency: true, entries: { select: { direction: true, amount: true } } } }
      },
      orderBy: { createdAt: "desc" },
      take: 5000
    })
  ]);
  const purchases = reservations.map((reservation) => {
    const finance = reservation.finance;
    const totalAmount = number(finance?.totalAmount);
    const paidAmount = finance?.entries.reduce((sum, entry) => sum + (entry.direction === "INCOME" ? number(entry.amount) : -number(entry.amount)), 0) ?? 0;
    const paymentStatus = !finance ? "NO_PLAN" : paidAmount <= 0 ? "UNPAID" : paidAmount + 0.001 >= totalAmount ? "PAID" : "PARTIAL";
    return { ...reservation, finance: finance ? { totalAmount, paidAmount, remainingAmount: Math.max(0, totalAmount - paidAmount), currency: finance.currency, paymentStatus } : null };
  });
  // Store the JSON wire format so dates and Prisma decimals survive cache reads.
  return JSON.parse(JSON.stringify({ generatedAt: now.toISOString(), tours, purchases }));
}, ["lead-data-v1"], { revalidate: 60 });

export async function GET(request: Request) {
  if (!hasValidIntegrationKey(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await loadLeadData(), { headers: { "Cache-Control": "private, no-store" } });
}
