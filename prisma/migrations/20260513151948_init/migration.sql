-- CreateTable
CREATE TABLE "Tour" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourDay" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "hour" TEXT,
    "city" TEXT,
    "country" TEXT,
    "photoUrl" TEXT,
    "activity" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,

    CONSTRAINT "TourDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TourDay_tourId_idx" ON "TourDay"("tourId");

-- AddForeignKey
ALTER TABLE "TourDay" ADD CONSTRAINT "TourDay_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;
