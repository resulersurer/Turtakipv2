CREATE TYPE "MemberRole" AS ENUM ('MANAGEMENT', 'STAFF', 'PASSENGER', 'GUIDE', 'AGENCY');

ALTER TABLE "Member" ADD COLUMN "role" "MemberRole" NOT NULL DEFAULT 'PASSENGER';

CREATE INDEX "Member_role_idx" ON "Member"("role");
