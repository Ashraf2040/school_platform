-- CreateTable
CREATE TABLE "LessonPlan" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "unit" TEXT NOT NULL,
    "lessonTopic" TEXT NOT NULL,
    "studentOutcomes" TEXT NOT NULL,
    "vocabularyKeyTerms" TEXT NOT NULL,
    "warmupDescription" TEXT,
    "instructionalDescription" TEXT,
    "proceduresDescription" TEXT,
    "assessmentDescription" TEXT,
    "closure" TEXT,
    "higherOrderThinking" TEXT,
    "materialsText" BOOLEAN NOT NULL DEFAULT false,
    "materialsTextPage" TEXT,
    "materialsBoard" BOOLEAN NOT NULL DEFAULT false,
    "materialsOverheadProjector" BOOLEAN NOT NULL DEFAULT false,
    "materialsVideo" BOOLEAN NOT NULL DEFAULT false,
    "materialsLab" BOOLEAN NOT NULL DEFAULT false,
    "materialsWebsite" TEXT,
    "materialsStudentBook" BOOLEAN NOT NULL DEFAULT false,
    "materialsOtherResources" TEXT,
    "warmupQuestions" BOOLEAN NOT NULL DEFAULT false,
    "warmupStories" BOOLEAN NOT NULL DEFAULT false,
    "warmupRevision" BOOLEAN NOT NULL DEFAULT false,
    "warmupVideo" BOOLEAN NOT NULL DEFAULT false,
    "warmupHomework" BOOLEAN NOT NULL DEFAULT false,
    "instrReading" BOOLEAN NOT NULL DEFAULT false,
    "instrDiscussion" BOOLEAN NOT NULL DEFAULT false,
    "instrProblemSolving" BOOLEAN NOT NULL DEFAULT false,
    "instrCriticalThinking" BOOLEAN NOT NULL DEFAULT false,
    "instrWriting" BOOLEAN NOT NULL DEFAULT false,
    "instrIndividual" BOOLEAN NOT NULL DEFAULT false,
    "instrWorksheets" BOOLEAN NOT NULL DEFAULT false,
    "instrGroupWork" BOOLEAN NOT NULL DEFAULT false,
    "procDemonstration" BOOLEAN NOT NULL DEFAULT false,
    "procLecture" BOOLEAN NOT NULL DEFAULT false,
    "procQa" BOOLEAN NOT NULL DEFAULT false,
    "procReview" BOOLEAN NOT NULL DEFAULT false,
    "procTest" BOOLEAN NOT NULL DEFAULT false,
    "procIndividual" BOOLEAN NOT NULL DEFAULT false,
    "procBrainstorming" BOOLEAN NOT NULL DEFAULT false,
    "procProblemSolving" BOOLEAN NOT NULL DEFAULT false,
    "procCooperativeLearning" BOOLEAN NOT NULL DEFAULT false,
    "procDebating" BOOLEAN NOT NULL DEFAULT false,
    "procLearningByDoing" BOOLEAN NOT NULL DEFAULT false,
    "procRolePlaying" BOOLEAN NOT NULL DEFAULT false,
    "assessTestQuiz" BOOLEAN NOT NULL DEFAULT false,
    "assessHomework" BOOLEAN NOT NULL DEFAULT false,
    "assessTeacherObservation" BOOLEAN NOT NULL DEFAULT false,
    "assessProject" BOOLEAN NOT NULL DEFAULT false,
    "assessRevision" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LessonPlan_teacherId_idx" ON "LessonPlan"("teacherId");

-- CreateIndex
CREATE INDEX "LessonPlan_classId_idx" ON "LessonPlan"("classId");

-- CreateIndex
CREATE INDEX "LessonPlan_subjectId_idx" ON "LessonPlan"("subjectId");

-- CreateIndex
CREATE INDEX "LessonPlan_date_idx" ON "LessonPlan"("date");

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
