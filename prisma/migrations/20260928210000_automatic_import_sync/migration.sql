ALTER TABLE "Tour" ADD COLUMN "sourceHash" TEXT;

CREATE TABLE "ImportSource" (
  "id" TEXT NOT NULL, "key" TEXT NOT NULL, "label" TEXT NOT NULL, "listUrl" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true, "lastCheckedAt" TIMESTAMP(3), "lastSuccessAt" TIMESTAMP(3),
  "lastError" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ImportSource_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ImportSourceTour" (
  "id" TEXT NOT NULL, "sourceId" TEXT NOT NULL, "detailUrl" TEXT NOT NULL, "tourId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true, "lastSeenAt" TIMESTAMP(3) NOT NULL, "missingSince" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ImportSourceTour_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ImportSyncRun" (
  "id" TEXT NOT NULL, "trigger" TEXT NOT NULL, "status" TEXT NOT NULL, "sources" INTEGER NOT NULL DEFAULT 0,
  "discovered" INTEGER NOT NULL DEFAULT 0, "created" INTEGER NOT NULL DEFAULT 0, "updated" INTEGER NOT NULL DEFAULT 0,
  "unchanged" INTEGER NOT NULL DEFAULT 0, "archived" INTEGER NOT NULL DEFAULT 0, "failed" INTEGER NOT NULL DEFAULT 0,
  "error" TEXT, "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "finishedAt" TIMESTAMP(3),
  CONSTRAINT "ImportSyncRun_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ImportSource_key_key" ON "ImportSource"("key");
CREATE UNIQUE INDEX "ImportSource_listUrl_key" ON "ImportSource"("listUrl");
CREATE INDEX "ImportSource_active_idx" ON "ImportSource"("active");
CREATE UNIQUE INDEX "ImportSourceTour_sourceId_detailUrl_key" ON "ImportSourceTour"("sourceId", "detailUrl");
CREATE INDEX "ImportSourceTour_tourId_active_idx" ON "ImportSourceTour"("tourId", "active");
CREATE INDEX "ImportSourceTour_sourceId_active_idx" ON "ImportSourceTour"("sourceId", "active");
CREATE INDEX "ImportSyncRun_startedAt_idx" ON "ImportSyncRun"("startedAt");
ALTER TABLE "ImportSourceTour" ADD CONSTRAINT "ImportSourceTour_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ImportSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImportSourceTour" ADD CONSTRAINT "ImportSourceTour_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE SET NULL ON UPDATE CASCADE;
