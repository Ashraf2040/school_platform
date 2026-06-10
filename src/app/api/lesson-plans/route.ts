// app/api/lesson-plans/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const {
      classId,
      subjectId,
      grade,
      date,
      unit,
      lessonTopic,
      studentOutcomes,
      vocabulary,
      materials,
      warmup,
      instructionalDelivery,
      procedures,
      assessment,
      closure,
      higherOrderThinking,
    } = body;

    if (!classId || !subjectId) {
      return NextResponse.json(
        { error: "Class and Subject are required" },
        { status: 400 }
      );
    }

    const lessonPlan = await prisma.lessonPlan.create({
      data: {
        teacherId: session.user.id,
        classId,
        subjectId,
        grade: grade || null,
        date: date ? new Date(date) : null,
        unit: unit || "",
        lessonTopic: lessonTopic || "",
        studentOutcomes: studentOutcomes || "",
        vocabularyKeyTerms: vocabulary || "",
        materialsText: materials?.text ?? false,
        materialsTextPage: materials?.textPage ?? null,
        materialsBoard: materials?.board ?? false,
        materialsOverheadProjector: materials?.overheadProjector ?? false,
        materialsVideo: materials?.video ?? false,
        materialsLab: materials?.lab ?? false,
        materialsWebsite: materials?.website ?? null,
        materialsStudentBook: materials?.studentBook ?? false,
        materialsOtherResources: materials?.otherResources ?? null,

        warmupQuestions: warmup?.questions ?? false,
        warmupStories: warmup?.stories ?? false,
        warmupRevision: warmup?.revision ?? false,
        warmupVideo: warmup?.video ?? false,
        warmupHomework: warmup?.homework ?? false,
        warmupDescription: warmup?.description ?? "",

        instrReading: instructionalDelivery?.reading ?? false,
        instrDiscussion: instructionalDelivery?.discussion ?? false,
        instrProblemSolving: instructionalDelivery?.problemSolving ?? false,
        instrCriticalThinking: instructionalDelivery?.criticalThinking ?? false,
        instrWriting: instructionalDelivery?.writing ?? false,
        instrIndividual: instructionalDelivery?.individual ?? false,
        instrWorksheets: instructionalDelivery?.worksheets ?? false,
        instrGroupWork: instructionalDelivery?.groupWork ?? false,
        instructionalDescription: instructionalDelivery?.description ?? "",

        procDemonstration: procedures?.demonstration ?? false,
        procLecture: procedures?.lecture ?? false,
        procQa: procedures?.qa ?? false,
        procReview: procedures?.review ?? false,
        procTest: procedures?.test ?? false,
        procIndividual: procedures?.individual ?? false,
        procBrainstorming: procedures?.brainstorming ?? false,
        procProblemSolving: procedures?.problemSolving ?? false,
        procCooperativeLearning: procedures?.cooperativeLearning ?? false,
        procDebating: procedures?.debating ?? false,
        procLearningByDoing: procedures?.learningByDoing ?? false,
        procRolePlaying: procedures?.rolePlaying ?? false,
        proceduresDescription: procedures?.description ?? "",

        assessTestQuiz: assessment?.testQuiz ?? false,
        assessHomework: assessment?.homework ?? false,
        assessTeacherObservation: assessment?.teacherObservation ?? false,
        assessProject: assessment?.project ?? false,
        assessRevision: assessment?.revision ?? false,
        assessmentDescription: assessment?.description ?? "",

        closure: closure || "",
        higherOrderThinking: higherOrderThinking || "",
      },
    });

    return NextResponse.json({ success: true, lessonPlan }, { status: 201 });
  } catch (error) {
    console.error("Error creating lesson plan:", error);
    return NextResponse.json({ error: "Failed to create lesson plan" }, { status: 500 });
  }
}
