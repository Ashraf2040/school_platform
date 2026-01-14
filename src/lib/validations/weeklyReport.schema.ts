// src/lib/validations/weeklyReport.schema.ts
import { z } from "zod";

export const weeklyReportSchema = z.object({
  date: z.string().min(1),
  classId: z.string().min(1),
  week: z.string().min(1),
  
  // ── NEW FIELDS ───────────────────────────────
  weekFrom: z.string().min(1, "تاريخ بداية الأسبوع مطلوب"),
  weekTo:   z.string().min(1, "تاريخ نهاية الأسبوع مطلوب"),
  preparedLessonPlans: z.boolean(),
  lessonPlanDocument: z.any().optional(),

  usedVariedMethods: z.boolean(),
  teachingMethods: z.array(z.string()),
  gradesTaught: z.array(z.string()),
  teachingMethodDescription: z.string().optional(),

  studentsEngaged: z.boolean(),
  studentWorkSample: z.any().optional(),

  maintainedPositiveEnvironment: z.boolean(),
  environmentCommentsType: z.array(z.string()),
  teacherComment: z.string().optional(),

  providedClearFeedback: z.boolean(),
  feedbackQuality: z.array(z.string()),
  studentsNeedingHelp: z.string().optional(),

  platformLevel: z.enum(["IXL", "Apex Learning"]).optional(),
  usedDigitalPlatform: z.boolean(),
  gradesBookScreenshot: z.any().optional(),

  monitoredAssignments: z.boolean(),
  assignmentsScreenshot: z.any().optional(),

  aiTutorComment: z.string().optional(),
  readingProgressComment: z.string().optional(),
  exactPathComment: z.string().optional(),

  atRiskStudentsReasons: z.array(z.string()),
  atRiskStudentsNames: z.string().optional(),

  highPerformingStudentsReasons: z.array(z.string()),
  highPerformingStudentsNames: z.string().optional(),

  issues: z.array(z.string()),
  mainChallenge: z.string().optional(),
  supportNeeded: z.string().optional(),

  teacherSignature: z.string().min(1),
  signatureDate: z.string().min(1),
});

export type WeeklyReportInput = z.infer<typeof weeklyReportSchema>;
