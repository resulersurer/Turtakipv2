CREATE TYPE "TourRequestStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'CLOSED');

CREATE TABLE "TourRequest" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "status" "TourRequestStatus" NOT NULL DEFAULT 'NEW',
  "fullName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "city" TEXT,
  "adultCount" INTEGER NOT NULL DEFAULT 1,
  "childCount" INTEGER NOT NULL DEFAULT 0,
  "preferredDate" TIMESTAMP(3),
  "budget" TEXT,
  "notes" TEXT,
  "sourcePage" TEXT NOT NULL,
  "sourceLabel" TEXT,
  "referrer" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "tourId" TEXT,
  "tourName" TEXT,
  "tourSlug" TEXT,
  "memberId" TEXT,
  "contactedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TourRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TourRequest_code_key" ON "TourRequest"("code");
CREATE INDEX "TourRequest_status_createdAt_idx" ON "TourRequest"("status", "createdAt");
CREATE INDEX "TourRequest_tourId_createdAt_idx" ON "TourRequest"("tourId", "createdAt");
CREATE INDEX "TourRequest_memberId_createdAt_idx" ON "TourRequest"("memberId", "createdAt");
ALTER TABLE "TourRequest" ADD CONSTRAINT "TourRequest_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TourRequest" ADD CONSTRAINT "TourRequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
