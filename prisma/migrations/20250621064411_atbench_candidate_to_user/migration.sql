-- AlterTable
ALTER TABLE "candidates" ADD COLUMN     "createdUserId" TEXT,
ADD COLUMN     "userCreatedAt" TIMESTAMP(3),
ADD COLUMN     "userCreatedBy" TEXT;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_createdUserId_fkey" FOREIGN KEY ("createdUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_userCreatedBy_fkey" FOREIGN KEY ("userCreatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
