CREATE TYPE "ImportJobStatus" AS ENUM ('ACTIVE', 'COMPLETED');

CREATE TYPE "ImportItemStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED');

CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImportJobItem" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "status" "ImportItemStatus" NOT NULL DEFAULT 'PENDING',
    "tourId" TEXT,
    "tourName" TEXT,
    "error" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJobItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ImportJob_sourceUrl_idx" ON "ImportJob"("sourceUrl");
CREATE INDEX "ImportJob_createdAt_idx" ON "ImportJob"("createdAt");
CREATE INDEX "ImportJobItem_status_idx" ON "ImportJobItem"("status");
CREATE INDEX "ImportJobItem_sortOrder_idx" ON "ImportJobItem"("sortOrder");
CREATE UNIQUE INDEX "ImportJobItem_jobId_url_key" ON "ImportJobItem"("jobId", "url");

ALTER TABLE "ImportJobItem" ADD CONSTRAINT "ImportJobItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
