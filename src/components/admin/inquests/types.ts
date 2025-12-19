// components/admin/inquests/types.ts

export type Teacher = {
  id: string;
  name: string;
  username: string;
  teacherProfile?: {
    jobTitle?: string;
    specialty?: string;
    schoolName?: string;
  };
};

export type AcademicYear = {
  id: string;
  name: string;
  isCurrent: boolean;
};

export type Inquest = {
  drawAttentionText?: string;
  id: string;
  inquestType: "ABSENT" | "NEGLIGENCE";
  reason: string;
  details?: string;
  teacherJobTitle?: string;
  teacherSpecialty?: string;
  teacherSchool?: string;
  clarificationRequest?: string;
  principalOpinion?: string;
  decisionText?: string;
  teacherClarification?: string;
  attachmentUrl?: string;
  status: "PENDING" | "RESPONDED" | "COMPLETED";
  createdAt: string;
  teacher: Teacher;
  academicYear: AcademicYear;
};