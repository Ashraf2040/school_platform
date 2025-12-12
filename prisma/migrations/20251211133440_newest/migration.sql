-- CreateEnum
CREATE TYPE "InquestStatus" AS ENUM ('PENDING', 'RESPONDED', 'COMPLETED');

-- AlterTable
ALTER TABLE "Inquest" ADD COLUMN     "attachmentUrl" TEXT,
ADD COLUMN     "status" "InquestStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "teacherClarification" TEXT;
