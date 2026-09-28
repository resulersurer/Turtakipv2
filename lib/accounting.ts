import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ReservationError } from "@/lib/reservations/domain";

const money = z.number().finite().positive().max(100_000_000);
const currency = z.enum(["TRY", "EUR", "USD", "GBP"]);
export const accountInput = z.object({ action: z.literal("account"), name: z.string().trim().min(2).max(80), type: z.enum(["CASH", "BANK"]), currency, openingBalance: z.number().finite().min(-100_000_000).max(100_000_000).default(0) });
export const planInput = z.object({ action: z.literal("plan"), reservationId: z.string().min(1), totalAmount: money, currency, installmentCount: z.number().int().min(1).max(24), firstDueDate: z.string().date() });
export const entryInput = z.object({ action: z.literal("entry"), accountId: z.string().min(1), financeId: z.string().optional(), installmentId: z.string().optional(), direction: z.enum(["INCOME", "EXPENSE"]), type: z.enum(["RESERVATION_PAYMENT", "EXPENSE", "REFUND", "ADJUSTMENT"]), amount: money, description: z.string().trim().min(2).max(240), reference: z.string().trim().max(120).optional(), occurredAt: z.string().datetime({ offset: true }) });
export const accountingInput = z.discriminatedUnion("action", [accountInput, planInput, entryInput]);

const number = (value: Prisma.Decimal | number) => typeof value === "number" ? value : value.toNumber();
const addMonths = (date: Date, count: number) => { const next = new Date(date); next.setUTCMonth(next.getUTCMonth() + count); return next; };

export async function getAccountingDashboard() {
  const [accounts, plans, reservations, entries] = await Promise.all([
    prisma.cashAccount.findMany({ where: { active: true }, include: { entries: { select: { direction: true, amount: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.reservationFinance.findMany({ include: { reservation: { include: { departure: { include: { tour: { select: { name: true } } } } } }, installments: { include: { entries: { select: { direction: true, amount: true } } }, orderBy: { sequence: "asc" } }, entries: { select: { direction: true, amount: true } } }, orderBy: { updatedAt: "desc" } }),
    prisma.reservation.findMany({ where: { finance: null, status: { not: "CANCELLED" } }, select: { id: true, code: true, contactName: true, departure: { select: { tour: { select: { name: true } } } } }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.cashEntry.findMany({ include: { account: { select: { name: true, currency: true } }, finance: { include: { reservation: { select: { code: true, contactName: true } } } } }, orderBy: { occurredAt: "desc" }, take: 30 })
  ]);
  const accountRows = accounts.map(({ entries: rows, ...account }) => ({ ...account, openingBalance: number(account.openingBalance), balance: rows.reduce((sum, row) => sum + (row.direction === "INCOME" ? number(row.amount) : -number(row.amount)), number(account.openingBalance)) }));
  const planRows = plans.map(({ entries: rows, installments, ...plan }) => {
    const paid = rows.reduce((sum, row) => sum + (row.direction === "INCOME" ? number(row.amount) : -number(row.amount)), 0);
    return { ...plan, totalAmount: number(plan.totalAmount), paid, remaining: number(plan.totalAmount) - paid, installments: installments.map(({ entries: installmentEntries, ...installment }) => ({ ...installment, amount: number(installment.amount), paid: installmentEntries.reduce((sum, row) => sum + (row.direction === "INCOME" ? number(row.amount) : -number(row.amount)), 0) })) };
  });
  return { accounts: accountRows, plans: planRows, reservations, entries: entries.map((entry) => ({ ...entry, amount: number(entry.amount) })) };
}

export async function applyAccountingAction(input: unknown) {
  const data = accountingInput.parse(input);
  if (data.action === "account") return prisma.cashAccount.create({ data: { name: data.name, type: data.type, currency: data.currency, openingBalance: data.openingBalance } });
  if (data.action === "plan") {
    const totalCents = Math.round(data.totalAmount * 100);
    const base = Math.floor(totalCents / data.installmentCount);
    const first = new Date(`${data.firstDueDate}T00:00:00.000Z`);
    return prisma.reservationFinance.create({ data: { reservationId: data.reservationId, totalAmount: data.totalAmount, currency: data.currency, installmentCount: data.installmentCount, installments: { create: Array.from({ length: data.installmentCount }, (_, index) => ({ sequence: index + 1, dueDate: addMonths(first, index), amount: (base + (index === data.installmentCount - 1 ? totalCents - base * data.installmentCount : 0)) / 100 })) } } });
  }
  return prisma.$transaction(async (tx) => {
    const account = await tx.cashAccount.findUnique({ where: { id: data.accountId } });
    if (!account || !account.active) throw new ReservationError("Kasa veya banka hesabı bulunamadı.", 404);
    let finance = null;
    if (data.financeId) finance = await tx.reservationFinance.findUnique({ where: { id: data.financeId }, include: { entries: true } });
    if (data.type === "RESERVATION_PAYMENT" && !finance) throw new ReservationError("Tahsilat için rezervasyon ödeme planı seçin.", 400);
    if (data.type === "RESERVATION_PAYMENT" && !data.installmentId) throw new ReservationError("Tahsilat için taksit seçin.", 400);
    if (finance && finance.currency !== account.currency) throw new ReservationError("Kasa para birimi ödeme planıyla aynı olmalıdır.", 400);
    if (data.installmentId) {
      const installment = await tx.installment.findUnique({ where: { id: data.installmentId } });
      if (!installment || installment.financeId !== data.financeId) throw new ReservationError("Geçersiz taksit seçimi.", 400);
    }
    if (finance && data.direction === "INCOME") {
      const paid = finance.entries.reduce((sum, row) => sum + (row.direction === "INCOME" ? number(row.amount) : -number(row.amount)), 0);
      if (paid + data.amount > number(finance.totalAmount) + 0.001) throw new ReservationError("Tahsilat kalan borcu aşamaz.", 409);
    }
    return tx.cashEntry.create({ data: { accountId: data.accountId, financeId: data.financeId || null, installmentId: data.installmentId || null, direction: data.direction, type: data.type, amount: data.amount, description: data.description, reference: data.reference || null, occurredAt: new Date(data.occurredAt) } });
  });
}
