-- Link customer-created reservations to their member account.
ALTER TABLE "Reservation" ADD COLUMN "memberId" TEXT;

CREATE INDEX "Reservation_memberId_createdAt_idx" ON "Reservation"("memberId", "createdAt");

ALTER TABLE "Reservation"
ADD CONSTRAINT "Reservation_memberId_fkey"
FOREIGN KEY ("memberId") REFERENCES "Member"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
