CREATE TABLE "AdminNotification" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "tourId" TEXT,
  "departureId" TEXT,
  "startDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AdminNotification_createdAt_idx" ON "AdminNotification"("createdAt");
ALTER TABLE "AdminNotification" ADD CONSTRAINT "AdminNotification_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE SET NULL ON UPDATE CASCADE;
