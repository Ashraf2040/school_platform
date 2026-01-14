-- AlterTable
ALTER TABLE "WeeklyReport" ADD COLUMN     "adminActionPlan" TEXT,
ADD COLUMN     "adminClassroomEnvironment" INTEGER,
ADD COLUMN     "adminClassroomLessonPlanning" INTEGER,
ADD COLUMN     "adminClassroomStudentEngagement" INTEGER,
ADD COLUMN     "adminClassroomStudentFeedback" INTEGER,
ADD COLUMN     "adminClassroomTeachingMethods" INTEGER,
ADD COLUMN     "adminDigitalAssignmentMonitoring" INTEGER,
ADD COLUMN     "adminDigitalCommunication" INTEGER,
ADD COLUMN     "adminDigitalPlatformUsage" INTEGER,
ADD COLUMN     "adminEvaluationDate" TIMESTAMP(3),
ADD COLUMN     "adminEvaluationLevel" TEXT,
ADD COLUMN     "adminImprovements" TEXT,
ADD COLUMN     "adminIssuesManagement" INTEGER,
ADD COLUMN     "adminMonitoringAtRisk" INTEGER,
ADD COLUMN     "adminMonitoringHighPerforming" INTEGER,
ADD COLUMN     "adminName" TEXT,
ADD COLUMN     "adminSignature" TEXT,
ADD COLUMN     "adminSignatureDate" TIMESTAMP(3),
ADD COLUMN     "adminStrengths" TEXT,
ADD COLUMN     "adminTeacherLevel" INTEGER,
ADD COLUMN     "adminTotalScore" INTEGER,
ADD COLUMN     "teacherConfirmDate" TIMESTAMP(3),
ADD COLUMN     "teacherConfirmSignature" TEXT;

-- CreateIndex
CREATE INDEX "WeeklyReport_submittedAt_idx" ON "WeeklyReport"("submittedAt");

-- CreateIndex
CREATE INDEX "WeeklyReport_evaluatedAt_idx" ON "WeeklyReport"("evaluatedAt");
