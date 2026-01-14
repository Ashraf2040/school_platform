
"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";

interface WeeklyReport {
  id: string;
  teacher: { name: string };
  weekStart: string;
  submittedAt: string | null;
  teacherData: {
    date: string;
    classId: string;
    week: string;
    preparedLessonPlans: boolean;
    lessonPlanDocument?: string;
    usedVariedMethods: boolean;
    teachingMethods: string[];
    gradesTaught: string[];
    teachingMethodDescription?: string;
    studentsEngaged: boolean;
    studentWorkSample?: string;
    maintainedPositiveEnvironment: boolean;
    environmentCommentsType: string[];
    teacherComment?: string;
    providedClearFeedback: boolean;
    feedbackQuality: string[];
    studentsNeedingHelp?: string;
    platformLevel?: "IXL" | "Apex Learning";
    usedDigitalPlatform: boolean;
    gradesBookScreenshot?: string;
    monitoredAssignments: boolean;
    assignmentsScreenshot?: string;
    aiTutorComment?: string;
    readingProgressComment?: string;
    exactPathComment?: string;
    atRiskStudentsReasons: string[];
    atRiskStudentsNames?: string;
    highPerformingStudentsReasons: string[];
    highPerformingStudentsNames?: string;
    issues: string[];
    mainChallenge?: string;
    supportNeeded?: string;
    teacherSignature: string;
    signatureDate: string;
  };
  adminData?: {
    adminName: string;
    evaluationDate: string;
    classroomScores: {
      lessonPlanning: number;
      teachingMethods: number;
      studentEngagement: number;
      classroomEnvironment: number;
      studentFeedback: number;
    };
    digitalScores: {
      platformUsage: number;
      communication: number;
      assignmentMonitoring: number;
    };
    monitoringScores: {
      atRisk: number;
      highPerforming: number;
    };
    issuesManagement: number;
    totalScore: number;
    evaluationLevel: "excellent" | "good" | "satisfactory" | "needsImprovement";
    teacherLevel: 1 | 2 | 3 | 4;
    strengths: string;
    improvements: string;
    actionPlan: string;
    adminSignature: string;
    adminSignatureDate: string;
    teacherConfirmSignature: string;
    teacherConfirmDate: string;
  };
}

export default function WeeklyEvaluationView() {
  const t = useTranslations("WeeklyEvaluation");
  const params = useParams();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const [adminForm, setAdminForm] = useState({
    adminName: "",
    evaluationDate: new Date().toISOString().split("T")[0],
    classroomScores: {
      lessonPlanning: 0,
      teachingMethods: 0,
      studentEngagement: 0,
      classroomEnvironment: 0,
      studentFeedback: 0,
    },
    digitalScores: {
      platformUsage: 0,
      communication: 0,
      assignmentMonitoring: 0,
    },
    monitoringScores: {
      atRisk: 0,
      highPerforming: 0,
    },
    issuesManagement: 0,
    evaluationLevel: "excellent" as "excellent" | "good" | "satisfactory" | "needsImprovement",
    teacherLevel: 4 as 1 | 2 | 3 | 4, // Default to lowest
    strengths: "",
    improvements: "",
    actionPlan: "",
    adminSignature: "",
    adminSignatureDate: new Date().toISOString().split("T")[0],
    teacherConfirmSignature: "",
    teacherConfirmDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    const fetchReport = async () => {
      if (!params.id) return;
      try {
        const res = await fetch(`/api/weekly-reports/${params.id}`);
        if (!res.ok) throw new Error(t("errors.fetchFailed"));
        const data = await res.json();
        setReport(data);
        if (data.adminData) {
          setAdminForm(data.adminData);
        }
      } catch {
        setError(t("errors.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [params.id, t]);
const locale = useLocale();
const isArabic = locale === "ar";

  // Logic to Auto-Calculate Teacher Level (1, 2, 3, 4) based on Score
  useEffect(() => {
    const totalScore = calculateTotalScore();
    let newLevel: 1 | 2 | 3 | 4 = 4;

    if (totalScore >= 90) {
      newLevel = 1; // Excellent
    } else if (totalScore >= 80) {
      newLevel = 2; // Good
    } else if (totalScore >= 70) {
      newLevel = 3; // Satisfactory
    } else {
      newLevel = 4; // Needs Improvement
    }
    
    setAdminForm(prev => ({ ...prev, teacherLevel: newLevel }));
  }, [
    adminForm.classroomScores, 
    adminForm.digitalScores, 
    adminForm.monitoringScores, 
    adminForm.issuesManagement
  ]);

  const calculateTotalScore = () => {
    const classroomTotal = Object.values(adminForm.classroomScores).reduce((a, b) => a + b, 0);
    const digitalTotal = Object.values(adminForm.digitalScores).reduce((a, b) => a + b, 0);
    const monitoringTotal = Object.values(adminForm.monitoringScores).reduce((a, b) => a + b, 0);
    return classroomTotal + digitalTotal + monitoringTotal + adminForm.issuesManagement;
  };

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalScore = calculateTotalScore();
    const updatedAdminData = { ...adminForm, totalScore };

    try {
      const res = await fetch(`/api/weekly-reports/${params.id}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedAdminData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "فشل في حفظ التقييم");
      }

      const updatedReportRes = await fetch(`/api/weekly-reports/${params.id}`);
      const updatedReport = await updatedReportRes.json();
      setReport(updatedReport);
      setShowEvaluationForm(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "حدث خطأ أثناء حفظ التقييم");
    }
  };

  const handleScoreChange = (section: string, key: string, value: number) => {
    setAdminForm((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] as Record<string, number>),
        [key]: value,
      },
    }));
  };

const handlePrint = () => {
  if (!report?.adminData) return;

  const admin = report.adminData;
  const teacherName = report.teacher.name || "غير محدد";
  const week = report.teacherData?.week || "غير محدد";
  const date = report.teacherData?.date || "غير محدد";

  const printWindow = window.open("", "_blank", "width=950,height=1300,scrollbars=yes");
  if (!printWindow) {
    alert("الرجاء السماح بفتح النوافذ المنبثقة في المتصفح");
    return;
  }
  const printContent = `
<!DOCTYPE html>
<html dir="${isArabic ? "rtl" : "ltr"}" lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>تقرير تقييم أسبوعي - ${teacherName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 15mm 10mm;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 10.8pt;
      line-height: 1.32;
      color: #111827;
      body {
  direction: ${isArabic ? "rtl" : "ltr"};
  text-align: ${isArabic ? "right" : "left"};
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 0 6mm;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 0.6rem;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 18pt;
      margin: 0.3em 0;
      color: #1e3a8a;
    }
    .meta {
      display: flex;
      justify-content: center;
      gap: 2.5rem;
      flex-wrap: wrap;
      margin: 0.5rem 0;
      font-size: 10.8pt;
    }
    .meta strong {
      color: #111827;
      font-weight: 600;
    }
    .meta span {
      color: #4b5563;
    }
    .evaluation-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f0f4ff;
      border: 1px solid #c7d2fe;
      border-radius: 6px;
      padding: 0.6rem 1rem;
      margin: 0.8rem 0;
    }
    .score-part {
      display: flex;
      align-items: center;
      gap: 1.2rem;
    }
    .big-score {
      font-size: 32pt;
      font-weight: bold;
      color: #4f46e5;
    }
    .level-badge {
      font-size: 13pt;
      font-weight: 700;
      padding: 0.4em 1em;
      border-radius: 999px;
      color: white;
    }
    .excellent { background: #10b981; }
    .good      { background: #3b82f6; }
    .satisfactory { background: #f59e0b; }
    .needsImprovement { background: #ef4444; }
    .teacher-level {
      font-size: 13pt;
      color: #374151;
      font-weight: 600;
    }
    .score-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 0.8rem;
      margin: 1rem 0;
    }
    .score-category {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 0.8rem;
    }
    .score-item {
      display: flex;
      justify-content: space-between;
      margin: 0.35em 0;
      font-size: 10pt;
    }
    .total {
      font-weight: bold;
      border-top: 1px solid #9ca3af;
      padding-top: 0.4em;
      margin-top: 0.5em;
    }
    .comment {
      background: #f1f5f9;
      border-right: 4px solid #6366f1;
      padding: 0.8rem 1.1rem;
      margin: 0.8rem 0;
      border-radius: 5px;
      font-size: 10.5pt;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 2.5rem;
      gap: 4rem;
    }
    .signature {
      flex: 1;
      text-align: center;
    }
    .sig-line {
      border-top: 1.5px solid #374151;
      margin: 3rem auto 0.6rem;
      width: 90%;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${t("print.title")}</h1>

      <div class="meta">
        <div><span>${t("print.teacherName")}:</span> <strong>${teacherName}</strong></div>
        <div><span>${t("print.week")}:</span> <strong>${week}</strong></div>
        <div><span>${t("print.date")}:</span> <strong>${date}</strong></div>
      </div>
    </div>

    <!-- Evaluation line -->
    <div class="evaluation-line">
      <div class="score-part">
        <div class="big-score">${admin.totalScore}/100</div>
        <div class="level-badge ${admin.evaluationLevel}">
          ${t(`levels.${admin.evaluationLevel}`)}
        </div>
      </div>

      <div class="teacher-level">
        ${t("print.teacherLevel")}: <strong>${admin.teacherLevel}</strong>
      </div>
    </div>

    <h2>${t("print.scoreDetails")}</h2>

    <div class="score-grid">
      <!-- Classroom -->
      <div class="score-category">
        <strong>${t("sections.classroomPerformance")} (60)</strong>

        ${Object.entries(admin.classroomScores).map(([key, value]) => `
          <div class="score-item">
            <span>${t(`labels.${key}`)}</span>
            <span>${value}/12</span>
          </div>
        `).join("")}

        <div class="total">
          <span>${t("common.total")}</span>
          <span>${Object.values(admin.classroomScores).reduce((a,b)=>a+b,0)}/60</span>
        </div>
      </div>

      <!-- Digital -->
      <div class="score-category">
        <strong>${t("sections.digitalPlatform")} (20)</strong>

        ${Object.entries(admin.digitalScores).map(([key, value]) => `
          <div class="score-item">
            <span>${t(`labels.${key}`)}</span>
            <span>${value}/${key === "assignmentMonitoring" ? "4" : "8"}</span>
          </div>
        `).join("")}

        <div class="total">
          <span>${t("common.total")}</span>
          <span>${Object.values(admin.digitalScores).reduce((a,b)=>a+b,0)}/20</span>
        </div>
      </div>

      <!-- Monitoring -->
      <div class="score-category">
        <strong>${t("sections.studentMonitoring")} (16)</strong>

        ${Object.entries(admin.monitoringScores).map(([key, value]) => `
          <div class="score-item">
            <span>${t(`sections.${key === "atRisk" ? "atRiskStudents" : "highPerformingStudents"}`)}</span>
            <span>${value}/8</span>
          </div>
        `).join("")}

        <div class="total">
          <span>${t("common.total")}</span>
          <span>${Object.values(admin.monitoringScores).reduce((a,b)=>a+b,0)}/16</span>
        </div>
      </div>

      <!-- Issues -->
      <div class="score-category">
        <div class="score-item">
          <strong>${t("sections.issuesManagement")}</strong>
          <span>${admin.issuesManagement}/4</span>
        </div>
      </div>
    </div>

    <!-- Comments -->
    ${admin.strengths ? `
      <div class="comment">
        <strong>${t("print.strengths")}:</strong>
        ${admin.strengths.replace(/\n/g, " • ")}
      </div>
    ` : ""}

    ${admin.improvements ? `
      <div class="comment">
        <strong>${t("print.improvements")}:</strong>
        ${admin.improvements.replace(/\n/g, " • ")}
      </div>
    ` : ""}

    ${admin.actionPlan ? `
      <div class="comment">
        <strong>${t("print.actionPlan")}:</strong>
        ${admin.actionPlan.replace(/\n/g, " • ")}
      </div>
    ` : ""}

    <!-- Signatures -->
    <div class="signatures">
      <div class="signature">
        <div class="sig-title">${t("print.adminSignature")}</div>
        <div class="sig-line"></div>
        <div>${admin.adminSignature || "_______________________"}</div>
        <div style="margin-top:.5rem;">${admin.adminSignatureDate || "__________"}</div>
      </div>

      <div class="signature">
        <div class="sig-title">${t("print.teacherSignature")}</div>
        <div class="sig-line"></div>
        <div>${admin.teacherConfirmSignature || "_______________________"}</div>
        <div style="margin-top:.5rem;">${admin.teacherConfirmDate || "__________"}</div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function () {
      setTimeout(() => window.print(), 600);
    };
  </script>
</body>

</html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-lg w-full mx-4 bg-white rounded-lg shadow-lg p-8 text-center border border-red-100">
          <h2 className="text-2xl font-bold text-red-700 mb-3">
            {t("errors.loadError")}
          </h2>
          <p className="text-gray-600">{error || t("errors.reportNotFound")}</p>
        </div>
      </div>
    );
  }

  const { teacherData, adminData } = report;

  const YesNo = (value: boolean) => (
    <span
      className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
        value
          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
          : "bg-rose-100 text-rose-800 border border-rose-200"
      }`}
    >
      {value ? t("yes") : t("no")}
    </span>
  );

  const FileLink = ({ url, children }: { url?: string; children: React.ReactNode }) =>
    url && typeof url === "string" && url.trim() ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm mt-2 transition-colors"
      >
        <span>↗</span> {children}
      </a>
    ) : null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <style dangerouslySetInnerHTML={{ __html: `
  @page {
    size: A4;
    margin: 20mm 15mm 25mm 15mm;
  }

  @media print {
    body {
      background: white !important;
      font-family: Arial, sans-serif;
      font-size: 11px;
      color: #111827;
    }

    .no-print {
      display: none !important;
    }

    .page {
      width: 210mm;
      page-break-after: always;
      margin: 0;
      padding: 0;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    section {
      page-break-inside: avoid;
    }

    .shadow, .shadow-sm, .shadow-lg {
      box-shadow: none !important;
      border: 1px solid #e5e7eb;
    }

    .text-indigo-600, .text-emerald-700, .text-rose-700 {
      color: #111827 !important;
    }

    .bg-indigo-700 {
      background-color: #4f46e5 !important;
      color: white !important;
    }

    .bg-emerald-100, .bg-rose-100 {
      background-color: white !important;
      border: 1px solid #111827 !important;
    }

    a {
      text-decoration: none !important;
      color: #111827 !important;
    }

    .print-only {
      display: block !important;
    }
  }

  .print-only {
    display: none;
  }
`}} />
      <div className="max-w-7xl mx-auto">
        <div className="no-print mb-6 flex gap-4 justify-between items-center">
         
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              disabled={!adminData}
              className="no-print inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4H9a2 2 0 00-2 2v2a2 2 0 002 2h10a2 2 0 002-2v-2a2 2 0 00-2-2h-2m-4-4V9m0 4v6m0 0v2m0-2v-2" />
              </svg>
              {t("actions.print") || "Print Report"}
            </button>
          </div>
        </div>

        <div ref={printRef} className="page">
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mb-8">
            <div className="bg-indigo-700 text-white px-8 py-10 text-center">
              <h1 className="text-3xl font-bold mb-4">{t("title")}</h1>
              <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 text-indigo-100">
                <div>
                  <span className="font-medium">{t("fields.teacherName")}: </span>
                  <span className="font-semibold">{report.teacher.name}</span>
                </div>
                <div>
                  <span className="font-medium">{t("fields.week")}: </span>
                  <span className="font-semibold">{teacherData.week}</span>
                </div>
                <div>
                  <span className="font-medium">{t("fields.date")}: </span>
                  <span className="font-semibold">{teacherData.date}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-10">
              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-gray-300 pb-3">
                  {t("sections.teacherPerformance")}
                </h2>

                <div className="grid sm:grid-cols-3 gap-6 mb-10 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div>
                    <dt className="text-sm font-medium text-gray-600">{t("fields.teacherName")}</dt>
                    <dd className="mt-1 text-gray-900 font-medium">{report.teacher.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">{t("fields.date")}</dt>
                    <dd className="mt-1 text-gray-900 font-medium">{teacherData.date}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">{t("fields.week")}</dt>
                    <dd className="mt-1 text-gray-900 font-medium">{teacherData.week}</dd>
                  </div>
                </div>

                <div className="space-y-10">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {t("sections.classPerformance")}
                  </h3>

                  <div className="space-y-8">
                    <AnswerBlock
                      question={t("questions.preparedLessonPlans")}
                      answer={YesNo(teacherData.preparedLessonPlans)}
                      link={
                        <FileLink url={teacherData.lessonPlanDocument}>
                          {t("actions.downloadLessonPlan")}
                        </FileLink>
                      }
                    />

                    <AnswerBlock
                      question={t("questions.usedVariedMethods")}
                      answer={YesNo(teacherData.usedVariedMethods)}
                      details={
                        <>
                          {teacherData.teachingMethods.length > 0 && (
                            <div className="mt-3 text-sm">
                              <span className="font-medium">{t("labels.usedMethods")}: </span>
                              {teacherData.teachingMethods.join(" • ")}
                            </div>
                          )}
                          {teacherData.gradesTaught.length > 0 && (
                            <div className="mt-1 text-sm">
                              <span className="font-medium">{t("labels.gradesTaught")}: </span>
                              {teacherData.gradesTaught.join(" • ")}
                            </div>
                          )}
                          {teacherData.teachingMethodDescription && (
                            <p className="mt-3 text-gray-700 italic text-sm">
                              « {teacherData.teachingMethodDescription} »
                            </p>
                          )}
                        </>
                      }
                    />

                    <AnswerBlock
                      question={t("questions.studentsEngaged")}
                      answer={YesNo(teacherData.studentsEngaged)}
                      link={
                        <FileLink url={teacherData.studentWorkSample}>
                          {t("actions.downloadStudentWork")}
                        </FileLink>
                      }
                    />

                    <AnswerBlock
                      question={t("questions.maintainedPositiveEnvironment")}
                      answer={YesNo(teacherData.maintainedPositiveEnvironment)}
                      details={
                        <>
                          {teacherData.environmentCommentsType.length > 0 && (
                            <div className="mt-3 text-sm">
                              <span className="font-medium">{t("labels.environmentComments")}: </span>
                              {teacherData.environmentCommentsType.join(" • ")}
                            </div>
                          )}
                          {teacherData.teacherComment && (
                            <p className="mt-3 text-gray-700 italic text-sm">
                              "{teacherData.teacherComment}"
                            </p>
                          )}
                        </>
                      }
                    />

                    <AnswerBlock
                      question={t("questions.providedClearFeedback")}
                      answer={YesNo(teacherData.providedClearFeedback)}
                      details={
                        <>
                          {teacherData.feedbackQuality.length > 0 && (
                            <div className="mt-3 text-sm">
                              <span className="font-medium">{t("labels.feedbackQuality")}: </span>
                              {teacherData.feedbackQuality.join(" • ")}
                            </div>
                          )}
                          {teacherData.studentsNeedingHelp && (
                            <div className="mt-3 text-sm">
                              <span className="font-medium">{t("labels.studentsNeedingHelp")}: </span>
                              {teacherData.studentsNeedingHelp}
                            </div>
                          )}
                        </>
                      }
                    />
                  </div>
                </div>

                <div className="mt-16">
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">
                    {t("sections.digitalPlatform")}
                  </h3>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-800 mb-4">{t("labels.platformUsage")}</h4>
                      {teacherData.platformLevel && (
                        <p className="mb-3">
                          <span className="font-medium">{t("labels.platform")}: </span>
                          {teacherData.platformLevel}
                        </p>
                      )}
                      <p className="mb-4">
                        <span className="font-medium">{t("questions.usedDigitalPlatform")}: </span>
                        {YesNo(teacherData.usedDigitalPlatform)}
                      </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-800 mb-4">{t("labels.platformComments")}</h4>
                      <div className="space-y-3 text-sm">
                        {teacherData.aiTutorComment && (
                          <p><strong>AI Tutor Zayed:</strong> {teacherData.aiTutorComment}</p>
                        )}
                        {teacherData.readingProgressComment && (
                          <p><strong>Reading Progress:</strong> {teacherData.readingProgressComment}</p>
                        )}
                        {teacherData.exactPathComment && (
                          <p><strong>Exact Path:</strong> {teacherData.exactPathComment}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-16 grid md:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-semibold text-rose-700 mb-4">
                      {t("sections.atRiskStudents")}
                    </h4>
                    {teacherData.atRiskStudentsReasons.length > 0 ? (
                      <div className="space-y-3 text-sm">
                        <p>
                          <strong>{t("labels.reasons")}:</strong>{" "}
                          {teacherData.atRiskStudentsReasons.join(" • ")}
                        </p>
                        {teacherData.atRiskStudentsNames && (
                          <p className="font-medium text-rose-800">
                            {teacherData.atRiskStudentsNames}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-600 italic">{t("labels.noAtRiskStudents")}</p>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-semibold text-emerald-700 mb-4">
                      {t("sections.highPerformingStudents")}
                    </h4>
                    {teacherData.highPerformingStudentsReasons.length > 0 ? (
                      <div className="space-y-3 text-sm">
                        <p>
                          <strong>{t("labels.reasons")}:</strong>{" "}
                          {teacherData.highPerformingStudentsReasons.join(" • ")}
                        </p>
                        {teacherData.highPerformingStudentsNames && (
                          <p className="font-medium text-emerald-800">
                            {teacherData.highPerformingStudentsNames}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-600 italic">{t("labels.noHighPerformingStudents")}</p>
                    )}
                  </div>
                </div>

                <div className="mt-16 bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">
                    {t("sections.challenges")}
                  </h3>
                  <div className="space-y-4 text-sm">
                    {teacherData.issues.length > 0 && (
                      <p>
                        <strong>{t("labels.issues")}:</strong>{" "}
                        {teacherData.issues.join(" • ")}
                      </p>
                    )}
                    {teacherData.mainChallenge && (
                      <p className="font-medium text-amber-800">
                        <strong>{t("labels.mainChallenge")}:</strong> {teacherData.mainChallenge}
                      </p>
                    )}
                    {teacherData.supportNeeded && (
                      <div>
                        <strong className="block mb-1">{t("labels.supportNeeded")}:</strong>
                        <p className="text-gray-700">{teacherData.supportNeeded}</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            <aside className="lg:col-span-1 space-y-8">
              {adminData && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sticky top-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6 border-b-2 border-gray-300 pb-3">
                    {t("sections.adminEvaluation")}
                  </h2>

                  <div className="text-center py-6 mb-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
                    <div className="text-4xl font-bold text-indigo-700 mb-2">
                      {adminData.totalScore}
                      <span className="text-2xl text-gray-600"> / 100</span>
                    </div>
                    <div className={`text-lg font-semibold py-2 px-4 rounded-full inline-block ${
                      adminData.evaluationLevel === "excellent" ? "bg-emerald-100 text-emerald-800" :
                      adminData.evaluationLevel === "good" ? "bg-blue-100 text-blue-800" :
                      adminData.evaluationLevel === "satisfactory" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {t(`levels.${adminData.evaluationLevel}`)}
                    </div>
                  </div>

                  <div className="mb-6 text-center">
                    <p className="text-sm font-medium text-gray-600 mb-1">{t("labels.teacherLevel")}</p>
                    <p className="text-3xl font-bold text-indigo-600">Level {adminData.teacherLevel}</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-2 text-sm">{t("sections.classPerformance")}</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>{t("labels.lessonPlanning")}</span>
                          <span className="font-medium">{adminData.classroomScores.lessonPlanning}/12</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("labels.teachingMethods")}</span>
                          <span className="font-medium">{adminData.classroomScores.teachingMethods}/12</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("labels.studentEngagement")}</span>
                          <span className="font-medium">{adminData.classroomScores.studentEngagement}/12</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("labels.classroomEnvironment")}</span>
                          <span className="font-medium">{adminData.classroomScores.classroomEnvironment}/12</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("labels.studentFeedback")}</span>
                          <span className="font-medium">{adminData.classroomScores.studentFeedback}/12</span>
                        </div>
                        <div className="border-t border-gray-300 pt-1 mt-1 flex justify-between font-bold">
                          <span>Total</span>
                          <span>
                            {Object.values(adminData.classroomScores).reduce((a, b) => a + b, 0)}/60
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-2 text-sm">{t("sections.digitalPlatform")}</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>{t("labels.platformUsage")}</span>
                          <span className="font-medium">{adminData.digitalScores.platformUsage}/8</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("labels.communication")}</span>
                          <span className="font-medium">{adminData.digitalScores.communication}/8</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("labels.assignmentMonitoring")}</span>
                          <span className="font-medium">{adminData.digitalScores.assignmentMonitoring}/4</span>
                        </div>
                        <div className="border-t border-gray-300 pt-1 mt-1 flex justify-between font-bold">
                          <span>Total</span>
                          <span>
                            {Object.values(adminData.digitalScores).reduce((a, b) => a + b, 0)}/20
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-2 text-sm">{t("sections.monitoring")}</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>{t("sections.atRiskStudents")}</span>
                          <span className="font-medium">{adminData.monitoringScores.atRisk}/8</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("sections.highPerformingStudents")}</span>
                          <span className="font-medium">{adminData.monitoringScores.highPerforming}/8</span>
                        </div>
                        <div className="border-t border-gray-300 pt-1 mt-1 flex justify-between font-bold">
                          <span>Total</span>
                          <span>
                            {Object.values(adminData.monitoringScores).reduce((a, b) => a + b, 0)}/16
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-800 text-sm">{t("labels.issuesManagement")}</span>
                        <span className="font-medium text-sm">{adminData.issuesManagement}/4</span>
                      </div>
                    </div>
                  </div>

                  {adminData.strengths && (
                    <div className="mb-4 p-3 bg-emerald-50 rounded border border-emerald-200">
                      <p className="text-xs font-semibold text-emerald-900 mb-1">{t("labels.strengths")}</p>
                      <p className="text-xs text-emerald-800">{adminData.strengths}</p>
                    </div>
                  )}

                  {adminData.improvements && (
                    <div className="mb-4 p-3 bg-amber-50 rounded border border-amber-200">
                      <p className="text-xs font-semibold text-amber-900 mb-1">{t("labels.improvements")}</p>
                      <p className="text-xs text-amber-800">{adminData.improvements}</p>
                    </div>
                  )}

                  {adminData.actionPlan && (
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-semibold text-blue-900 mb-1">{t("labels.actionPlan")}</p>
                      <p className="text-xs text-blue-800">{adminData.actionPlan}</p>
                    </div>
                  )}
                </div>
              )}

              {!adminData && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sticky top-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">
                    {t("sections.adminEvaluation")}
                  </h2>
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-6">{t("notEvaluatedYet")}</p>
                    <button 
                      onClick={() => setShowEvaluationForm(true)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-md transition-colors no-print"
                    >
                      {t("actions.startEvaluation")}
                    </button>
                  </div>
                </div>
              )}

              {showEvaluationForm && !adminData && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 no-print">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">
                    {t("sections.adminEvaluationForm")}
                  </h2>
                  <form onSubmit={handleSubmitEvaluation} className="space-y-8">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t("fields.adminName")}</label>
                        <input
                          type="text"
                          value={adminForm.adminName}
                          onChange={(e) => setAdminForm({ ...adminForm, adminName: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t("fields.evaluationDate")}</label>
                        <input
                          type="date"
                          value={adminForm.evaluationDate}
                          onChange={(e) => setAdminForm({ ...adminForm, evaluationDate: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("sections.classPerformance")} (Max 60)</h3>
                      <div className="space-y-4">
                        <ScoreInput
                          label={t("labels.lessonPlanning")}
                          value={adminForm.classroomScores.lessonPlanning}
                          max={12}
                          onChange={(v) => handleScoreChange("classroomScores", "lessonPlanning", v)}
                        />
                        <ScoreInput
                          label={t("labels.teachingMethods")}
                          value={adminForm.classroomScores.teachingMethods}
                          max={12}
                          onChange={(v) => handleScoreChange("classroomScores", "teachingMethods", v)}
                        />
                        <ScoreInput
                          label={t("labels.studentEngagement")}
                          value={adminForm.classroomScores.studentEngagement}
                          max={12}
                          onChange={(v) => handleScoreChange("classroomScores", "studentEngagement", v)}
                        />
                        <ScoreInput
                          label={t("labels.classroomEnvironment")}
                          value={adminForm.classroomScores.classroomEnvironment}
                          max={12}
                          onChange={(v) => handleScoreChange("classroomScores", "classroomEnvironment", v)}
                        />
                        <ScoreInput
                          label={t("labels.studentFeedback")}
                          value={adminForm.classroomScores.studentFeedback}
                          max={12}
                          onChange={(v) => handleScoreChange("classroomScores", "studentFeedback", v)}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("sections.digitalPlatform")} (Max 20)</h3>
                      <div className="space-y-4">
                        <ScoreInput
                          label={t("labels.platformUsage")}
                          value={adminForm.digitalScores.platformUsage}
                          max={8}
                          onChange={(v) => handleScoreChange("digitalScores", "platformUsage", v)}
                        />
                        <ScoreInput
                          label={t("labels.communication")}
                          value={adminForm.digitalScores.communication}
                          max={8}
                          onChange={(v) => handleScoreChange("digitalScores", "communication", v)}
                        />
                        <ScoreInput
                          label={t("labels.assignmentMonitoring")}
                          value={adminForm.digitalScores.assignmentMonitoring}
                          max={4} // Changed from 9 to 4 to help sum to 100
                          onChange={(v) => handleScoreChange("digitalScores", "assignmentMonitoring", v)}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("sections.monitoring")} (Max 16)</h3>
                      <div className="space-y-4">
                        <ScoreInput
                          label={t("sections.atRiskStudents")}
                          value={adminForm.monitoringScores.atRisk}
                          max={8}
                          onChange={(v) => handleScoreChange("monitoringScores", "atRisk", v)}
                        />
                        <ScoreInput
                          label={t("sections.highPerformingStudents")}
                          value={adminForm.monitoringScores.highPerforming}
                          max={8}
                          onChange={(v) => handleScoreChange("monitoringScores", "highPerforming", v)}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("labels.issuesManagement")} (Max 4)</h3>
                      <ScoreInput
                        label={t("labels.identification")}
                        value={adminForm.issuesManagement}
                        max={4} // Changed from 5 to 4
                        onChange={(v) => setAdminForm({ ...adminForm, issuesManagement: v })}
                      />
                    </div>

                    <div className="text-center py-4 bg-gray-50 rounded-md">
                      <p className="text-lg font-bold">{t("totalScore")}: {calculateTotalScore()} / 100</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t("labels.evaluationLevel")}</label>
                      <div className="space-y-2">
                        <label className="flex items-center text-sm">
                          <input
                            type="radio"
                            value="excellent"
                            checked={adminForm.evaluationLevel === "excellent"}
                            onChange={() => setAdminForm({ ...adminForm, evaluationLevel: "excellent" })}
                            className="mr-2"
                          />
                          {t("levels.excellent")}
                        </label>
                        <label className="flex items-center text-sm">
                          <input
                            type="radio"
                            value="good"
                            checked={adminForm.evaluationLevel === "good"}
                            onChange={() => setAdminForm({ ...adminForm, evaluationLevel: "good" })}
                            className="mr-2"
                          />
                          {t("levels.good")}
                        </label>
                        <label className="flex items-center text-sm">
                          <input
                            type="radio"
                            value="satisfactory"
                            checked={adminForm.evaluationLevel === "satisfactory"}
                            onChange={() => setAdminForm({ ...adminForm, evaluationLevel: "satisfactory" })}
                            className="mr-2"
                          />
                          {t("levels.satisfactory")}
                        </label>
                        <label className="flex items-center text-sm">
                          <input
                            type="radio"
                            value="needsImprovement"
                            checked={adminForm.evaluationLevel === "needsImprovement"}
                            onChange={() => setAdminForm({ ...adminForm, evaluationLevel: "needsImprovement" })}
                            className="mr-2"
                          />
                          {t("levels.needsImprovement")}
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t("labels.teacherLevel")} (Auto-set)</label>
                      <select
                        value={adminForm.teacherLevel}
                        onChange={(e) => setAdminForm({ ...adminForm, teacherLevel: Number(e.target.value) as 1 | 2 | 3 | 4 })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value={1}>1 (Excellent)</option>
                        <option value={2}>2 (Good)</option>
                        <option value={3}>3 (Satisfactory)</option>
                        <option value={4}>4 (Needs Improvement)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("labels.strengths")}</label>
                      <textarea
                        value={adminForm.strengths}
                        onChange={(e) => setAdminForm({ ...adminForm, strengths: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-24"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("labels.improvements")}</label>
                      <textarea
                        value={adminForm.improvements}
                        onChange={(e) => setAdminForm({ ...adminForm, improvements: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-24"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t("labels.actionPlan")}</label>
                      <textarea
                        value={adminForm.actionPlan}
                        onChange={(e) => setAdminForm({ ...adminForm, actionPlan: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm h-24"
                        required
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t("fields.adminSignature")}</label>
                        <input
                          type="text"
                          value={adminForm.adminSignature}
                          onChange={(e) => setAdminForm({ ...adminForm, adminSignature: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t("fields.adminSignatureDate")}</label>
                        <input
                          type="date"
                          value={adminForm.adminSignatureDate}
                          onChange={(e) => setAdminForm({ ...adminForm, adminSignatureDate: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t("fields.teacherConfirmSignature")}</label>
                        <input
                          type="text"
                          value={adminForm.teacherConfirmSignature}
                          onChange={(e) => setAdminForm({ ...adminForm, teacherConfirmSignature: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t("fields.teacherConfirmDate")}</label>
                        <input
                          type="date"
                          value={adminForm.teacherConfirmDate}
                          onChange={(e) => setAdminForm({ ...adminForm, teacherConfirmDate: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="submit"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-md transition-colors"
                      >
                        {t("actions.submitEvaluation")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowEvaluationForm(false)}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-md transition-colors"
                      >
                        {t("actions.cancel")}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 border-b-2 border-gray-300 pb-3">
                  {t("fields.signatureSection")}
                </h3>
                <div className="space-y-6">
                  <div>
                    <dt className="text-sm font-medium text-gray-600 mb-2">
                      {t("fields.teacherSignature")}
                    </dt>
                    <dd className="text-xl font-medium border-b-2 border-gray-400 pb-2 inline-block min-w-[180px]">
                      {teacherData.teacherSignature || "________________"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600 mb-2">
                      {t("fields.signatureDate")}
                    </dt>
                    <dd className="text-lg font-medium">
                      {teacherData.signatureDate || "________________"}
                    </dd>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

type AnswerBlockProps = {
  question: string;
  answer: React.ReactNode;
  link?: React.ReactNode;
  details?: React.ReactNode;
};

function AnswerBlock({ question, answer, link, details }: AnswerBlockProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h4 className="font-medium text-gray-800 mb-4 leading-relaxed">{question}</h4>
      <div className="mb-4">{answer}</div>
      {link}
      {details}
    </div>
  );
}

type ScoreInputProps = {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
};

function ScoreInput({ label, value, max, onChange }: ScoreInputProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-gray-700">{label} (0-{max})</label>
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm text-right"
        required
      />
    </div>
  );
}
