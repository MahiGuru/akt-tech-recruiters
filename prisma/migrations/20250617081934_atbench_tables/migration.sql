-- AlterTable
ALTER TABLE "interviews" ADD COLUMN     "communicationRating" INTEGER,
ADD COLUMN     "culturalFitRating" INTEGER,
ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "feedbackSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "feedbackSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "feedbackSubmittedById" TEXT,
ADD COLUMN     "nextSteps" TEXT,
ADD COLUMN     "outcome" TEXT,
ADD COLUMN     "overallRating" INTEGER,
ADD COLUMN     "recommendations" TEXT,
ADD COLUMN     "strengths" TEXT,
ADD COLUMN     "technicalRating" INTEGER,
ADD COLUMN     "weaknesses" TEXT,
ADD COLUMN     "wouldRecommendHiring" BOOLEAN;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_feedbackSubmittedById_fkey" FOREIGN KEY ("feedbackSubmittedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
