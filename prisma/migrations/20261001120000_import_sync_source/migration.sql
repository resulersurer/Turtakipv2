ALTER TABLE "ImportSyncRun" ADD COLUMN "sourceKey" TEXT;
CREATE INDEX "ImportSyncRun_sourceKey_startedAt_idx" ON "ImportSyncRun"("sourceKey", "startedAt");
