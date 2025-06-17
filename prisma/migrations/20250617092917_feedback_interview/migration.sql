-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('ANNUAL', 'MONTHLY', 'HOURLY');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "PlacementType" AS ENUM ('PERMANENT', 'CONTRACT', 'TEMP_TO_PERM');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'REMOTE', 'HYBRID');

-- CreateTable
CREATE TABLE "placements" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "salary" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "salaryType" "SalaryType" NOT NULL DEFAULT 'ANNUAL',
    "bonus" DECIMAL(15,2),
    "commission" DECIMAL(15,2),
    "benefits" TEXT[],
    "clientCompany" TEXT NOT NULL,
    "clientContactName" TEXT,
    "clientContactEmail" TEXT,
    "clientContactPhone" TEXT,
    "clientAddress" TEXT,
    "clientIndustry" TEXT,
    "vendorCompany" TEXT,
    "vendorContactName" TEXT,
    "vendorContactEmail" TEXT,
    "vendorContactPhone" TEXT,
    "vendorRate" DECIMAL(15,2),
    "vendorCommission" DECIMAL(15,2),
    "accountManager" TEXT,
    "placementFee" DECIMAL(15,2),
    "feeType" "FeeType" DEFAULT 'PERCENTAGE',
    "feePercentage" DECIMAL(5,2),
    "paymentTerms" TEXT,
    "jobTitle" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "placementType" "PlacementType" NOT NULL DEFAULT 'PERMANENT',
    "workLocation" TEXT,
    "workType" "WorkType" NOT NULL DEFAULT 'FULL_TIME',
    "reportingManager" TEXT,
    "notes" TEXT,
    "milestones" JSONB NOT NULL DEFAULT '[]',
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_documents" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "documentType" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placement_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "placements_candidateId_key" ON "placements"("candidateId");

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_documents" ADD CONSTRAINT "placement_documents_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "placements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_documents" ADD CONSTRAINT "placement_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
