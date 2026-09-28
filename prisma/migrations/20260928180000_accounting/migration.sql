CREATE TYPE "CashAccountType" AS ENUM ('CASH', 'BANK');
CREATE TYPE "CashEntryDirection" AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE "CashEntryType" AS ENUM ('RESERVATION_PAYMENT', 'EXPENSE', 'REFUND', 'ADJUSTMENT');

CREATE TABLE "ReservationFinance" (
  "id" TEXT NOT NULL, "reservationId" TEXT NOT NULL, "totalAmount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'TRY', "installmentCount" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReservationFinance_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Installment" (
  "id" TEXT NOT NULL, "financeId" TEXT NOT NULL, "sequence" INTEGER NOT NULL, "dueDate" TIMESTAMP(3) NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CashAccount" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "type" "CashAccountType" NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'TRY', "openingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "CashAccount_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CashEntry" (
  "id" TEXT NOT NULL, "accountId" TEXT NOT NULL, "financeId" TEXT, "installmentId" TEXT,
  "direction" "CashEntryDirection" NOT NULL, "type" "CashEntryType" NOT NULL, "amount" DECIMAL(12,2) NOT NULL,
  "description" TEXT NOT NULL, "reference" TEXT, "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "CashEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ReservationFinance_reservationId_key" ON "ReservationFinance"("reservationId");
CREATE UNIQUE INDEX "Installment_financeId_sequence_key" ON "Installment"("financeId", "sequence");
CREATE INDEX "Installment_dueDate_idx" ON "Installment"("dueDate");
CREATE INDEX "CashAccount_active_idx" ON "CashAccount"("active");
CREATE INDEX "CashEntry_accountId_occurredAt_idx" ON "CashEntry"("accountId", "occurredAt");
CREATE INDEX "CashEntry_financeId_occurredAt_idx" ON "CashEntry"("financeId", "occurredAt");
CREATE INDEX "CashEntry_installmentId_idx" ON "CashEntry"("installmentId");
ALTER TABLE "ReservationFinance" ADD CONSTRAINT "ReservationFinance_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_financeId_fkey" FOREIGN KEY ("financeId") REFERENCES "ReservationFinance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CashEntry" ADD CONSTRAINT "CashEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "CashAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashEntry" ADD CONSTRAINT "CashEntry_financeId_fkey" FOREIGN KEY ("financeId") REFERENCES "ReservationFinance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashEntry" ADD CONSTRAINT "CashEntry_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "Installment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
