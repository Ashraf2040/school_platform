-- DropForeignKey
ALTER TABLE "ScheduleItem" DROP CONSTRAINT "ScheduleItem_teacherId_fkey";

-- AlterTable
ALTER TABLE "ScheduleItem" ALTER COLUMN "teacherId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ScheduleItem" ADD CONSTRAINT "ScheduleItem_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
