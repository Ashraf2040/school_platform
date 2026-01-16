
"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface Class {
  id: string;
  name: string;
}

export default function TeacherWeeklyAchievement() {
  const t = useTranslations("WeeklyAchievement");
  const router = useRouter();

  // 1. Define Schema INSIDE component to access 't' for localization
  const formSchema = useMemo(() => {
    return z
      .object({
        date: z.string().min(1, t("errors.dateRequired") || "Date is required"),
        classId: z.string().min(1, t("errors.classRequired") || "Class is required"),
        week: z.string().min(1, t("errors.weekRequired") || "Week is required"),
        weekFrom: z.string().min(1, t("errors.weekFromRequired") || "Start date is required"),
        weekTo: z.string().min(1, { message: t("errors.weekToRequired") || "End date is required" }),
        
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

        teacherSignature: z.string().min(1, t("errors.signatureRequired") || "Signature is required"),
        signatureDate: z.string().min(1, t("errors.signatureDateRequired") || "Date is required"),
      })
      .refine((data) => new Date(data.weekTo) >= new Date(data.weekFrom), {
        // 2. Localized message with fallback
        message: t("errors.weekToInvalid") || "End date must be after or equal to start date",
        path: ["weekTo"],
      })
      // Example: If 'usedVariedMethods' is true, require at least one method in 'teachingMethods'
      .refine((data) => !data.usedVariedMethods || (data.teachingMethods && data.teachingMethods.length > 0), {
        message: t("errors.selectMethods") || "Please select at least one teaching method",
        path: ["teachingMethods"],
      });
  }, [t]);

  type FormData = z.infer<typeof formSchema>;

  const { data: session, status } = useSession();
  const [teacherName, setTeacherName] = useState<string>("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      week: "w1",
      classId: "",
      weekFrom: "",
      weekTo: "",
      preparedLessonPlans: false,
      usedVariedMethods: false,
      studentsEngaged: false,
      maintainedPositiveEnvironment: false,
      providedClearFeedback: false,
      usedDigitalPlatform: false,
      monitoredAssignments: false,
      teachingMethods: [],
      gradesTaught: [],
      environmentCommentsType: [],
      feedbackQuality: [],
      atRiskStudentsReasons: [],
      highPerformingStudentsReasons: [],
      issues: [],
      teacherSignature: "",
      signatureDate: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (session?.user?.name) {
      setTeacherName(session.user.name);
    }
  }, [session]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.id) return;

    const fetchClasses = async () => {
      try {
        const res = await fetch(`/api/users/${session.user.id}/classes`);
        const data = await res.json();
        setClasses(data || []);
      } catch {
        toast.error(t("fetchClassesError") || "فشل تحميل الفصول الدراسية");
      }
    };

    fetchClasses();
  }, [session, status, t]);

  const handleCheckboxArray =
    (
      field:
        | "teachingMethods"
        | "gradesTaught"
        | "environmentCommentsType"
        | "feedbackQuality"
        | "atRiskStudentsReasons"
        | "highPerformingStudentsReasons"
        | "issues",
      value: string
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const current = watch(field);
      setValue(
        field,
        e.target.checked
          ? [...current, value]
          : current.filter((item) => item !== value)
      );
    };

  const onSubmit = async (data: FormData) => {
    // ============================
    // 1. File Upload Logic (Same technique as Inquest)
    // ============================
const uploadFile = async (file: any): Promise<string | null> => {
  if (!file) return null;

  const realFile = file instanceof FileList ? file[0] : file;

  if (!realFile || typeof realFile === "string") return null;

  const formData = new FormData();
  formData.append("file", realFile);
const API_UPLOAD_URL = process.env.NEXT_PUBLIC_API_UPLOAD_URL || "http://localhost:3000";
  const uploadRes = await fetch(`${API_UPLOAD_URL}/upload`, { method: "POST", body: formData });

  if (!uploadRes.ok) {
    const err = await uploadRes.json();
    throw new Error(err.error || "Upload failed");
  }

  const uploadData = await uploadRes.json();
  return uploadData.url;
};


    try {
      // Upload all potential files in parallel
      const [lessonUrl, workUrl, gradesUrl, assignUrl] = await Promise.all([
        uploadFile(data.lessonPlanDocument),
        uploadFile(data.studentWorkSample),
        uploadFile(data.gradesBookScreenshot),
        uploadFile(data.assignmentsScreenshot)
      ]);

      // Replace file objects with URLs in the data object
      if (lessonUrl) data.lessonPlanDocument = lessonUrl as any;
      if (workUrl) data.studentWorkSample = workUrl as any;
      if (gradesUrl) data.gradesBookScreenshot = gradesUrl as any;
      if (assignUrl) data.assignmentsScreenshot = assignUrl as any;

    } catch (err: any) {
      console.error("❌ Upload error:", err);
      toast.error(err.message || "File upload failed");
      return;
    }

    // ============================
    // 2. Submit Final Data
    // ============================
    const finalFormData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => finalFormData.append(key, v as string));
      } else if (value !== undefined && value !== null) {
        // At this point, 'value' is either a string, number, boolean, or URL string.
        // We don't need to pass the original File object anymore.
        finalFormData.append(key, value as any);
      }
    });

    try {
      const res = await fetch("/api/teacher-reports", {
        method: "POST",
        body: finalFormData,
      });

      if (!res.ok) {
        throw new Error("فشل إرسال التقرير");
      }

      setShowSuccessModal(true);
      toast.success(t("successToast") || "تم إرسال التقرير الأسبوعي بنجاح");
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("حدث خطأ أثناء إرسال التقرير");
    }
  };

  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        router.push("/dashboard/teacher");
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, router]);

  const tt = (key: string): string[] => {
    const result = t.raw(key);
    if (!Array.isArray(result)) {
      console.warn(`Expected array for translation key "${key}", got:`, result);
      return [];
    }
    return result;
  };

  const isArabic = t("title").includes("نموذج");

  return (
    <>
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 py-6 px-4 sm:px-6 lg:px-8"
      >
        <div className="w-full mx-auto font-semibold">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              {t("title")}
            </h1>
          </div>

          {/* Main card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-100 overflow-hidden">
            {/* Accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-400 to-sky-400" />

            <div className="p-4 sm:p-6 lg:p-10">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 sm:space-y-12">
                {/* المعلومات الأساسية */}
                <section className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <h2 className="text-xl md:text-2xl font-semibold text-slate-900 flex items-center gap-2">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 text-lg font-bold">
                        1
                      </span>
                      {t("basicInfo")}
                    </h2>
                    <span className="text-xs md:text-sm px-3 py-1 rounded-full bg-teal-50 text-teal-700 w-fit">
                      {t("requiredSection") ?? "قسم أساسي"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("teacherName")}
                      </label>
                      <div className="px-4 py-3 bg-slate-50 rounded-xl text-base text-slate-900 border border-slate-200 flex items-center justify-between min-h-[44px]">
                        <span className="truncate">{teacherName || t("loading")}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("dateLabel")}
                      </label>
                      <input
                        type="date"
                        {...register("date")}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/60 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                      />
                      {errors.date && (
                        <p className="text-red-600 text-xs mt-1">
                          {errors.date.message || t("dateRequired")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("selectClass")}
                      </label>
                      <select
                        {...register("classId")}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                      >
                        <option value="">
                          {t("selectClassPlaceholder")}
                        </option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                      {errors.classId && (
                        <p className="text-red-600 text-xs mt-1">
                          {errors.classId.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("selectWeek")}
                      </label>
                      <select
                        {...register("week")}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                      >
                        {Array.from({ length: 20 }, (_, i) => `w${i + 1}`).map(
                          (w) => (
                            <option key={w} value={w}>
                              {w.toUpperCase()}
                            </option>
                          )
                        )}
                      </select>
                      {errors.week && (
                        <p className="text-red-600 text-xs mt-1">
                          {errors.week.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("weekFrom")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        {...register("weekFrom")}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/60 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                      />
                      {errors.weekFrom && (
                        <p className="text-red-600 text-xs mt-1">
                          {errors.weekFrom.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("weekTo")} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        {...register("weekTo")}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/60 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                      />
                      {/* 3. Added error display for weekTo which was missing explicit refinement display before */}
                      {errors.weekTo && (
                        <p className="text-red-600 text-xs mt-1">
                          {errors.weekTo.message}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                <div className="border-t border-dashed border-slate-200" />

                {/* أداء الفصل الدراسي */}
                <section className="space-y-6">
                  <h2 className="text-xl md:text-2xl font-semibold mb-2 text-teal-700 flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 text-lg font-bold">
                      2
                    </span>
                    {t("classroomPerformance")}
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="flex items-center gap-3 text-base px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-300 transition cursor-pointer">
                        <input
                          type="checkbox"
                          {...register("preparedLessonPlans")}
                          className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                        />
                        <span>{t("preparedLessonPlans")}</span>
                      </label>
                      {errors.preparedLessonPlans && (
                        <p className="text-red-600 text-xs mt-1">{errors.preparedLessonPlans.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("lessonPlanEvidence")}
                      </label>
                      <input
                        type="file"
                        {...register("lessonPlanDocument")}
                        className="w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-teal-50 file:text-teal-700 file:font-medium hover:file:bg-teal-100 border border-dashed border-slate-300 rounded-xl bg-slate-50/60 cursor-pointer"
                      />
                      {errors.lessonPlanDocument?.message && (
  <p className="text-red-600 text-xs mt-1">
    {String(errors.lessonPlanDocument.message)}
  </p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-3 text-base px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-300 transition cursor-pointer">
                        <input
                          type="checkbox"
                          {...register("usedVariedMethods")}
                          className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                        />
                        <span>{t("usedVariedMethods")}</span>
                      </label>
                      {errors.usedVariedMethods && (
                        <p className="text-red-600 text-xs mt-1">{errors.usedVariedMethods.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        {t("teachingMethodsLabel")}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {tt("teachingMethods").map((method) => (
                          <label
                            key={method}
                            className="flex items-center gap-3 text-sm px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={watch("teachingMethods").includes(
                                method
                              )}
                              onChange={handleCheckboxArray(
                                "teachingMethods",
                                method
                              )}
                              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                            />
                            <span className="truncate">{method}</span>
                          </label>
                        ))}
                      </div>
                      {/* Error display for array fields */}
                      {errors.teachingMethods && (
                        <p className="text-red-600 text-xs mt-1">
                          {errors.teachingMethods.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("teachingDescription")}
                      </label>
                      <textarea
                        {...register("teachingMethodDescription")}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
                        rows={3}
                      />
                      {errors.teachingMethodDescription && (
                        <p className="text-red-600 text-xs mt-1">{errors.teachingMethodDescription.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-3 text-base px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-300 transition cursor-pointer">
                        <input
                          type="checkbox"
                          {...register("studentsEngaged")}
                          className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                        />
                        <span>{t("studentsEngaged")}</span>
                      </label>
                      {errors.studentsEngaged && (
                        <p className="text-red-600 text-xs mt-1">{errors.studentsEngaged.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("studentWorkEvidence")}
                      </label>
                      <input
                        type="file"
                        {...register("studentWorkSample")}
                        className="w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-teal-50 file:text-teal-700 file:font-medium hover:file:bg-teal-100 border border-dashed border-slate-300 rounded-xl bg-slate-50/60 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-3 text-base px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-300 transition cursor-pointer">
                        <input
                          type="checkbox"
                          {...register("maintainedPositiveEnvironment")}
                          className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                        />
                        <span>{t("positiveEnvironment")}</span>
                      </label>
                      {errors.maintainedPositiveEnvironment && (
                        <p className="text-red-600 text-xs mt-1">{errors.maintainedPositiveEnvironment.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        {t("environmentTypesLabel")}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {tt("environmentTypes").map((type) => (
                          <label
                            key={type}
                            className="flex items-center gap-3 text-sm px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={watch(
                                "environmentCommentsType"
                              ).includes(type)}
                              onChange={handleCheckboxArray(
                                "environmentCommentsType",
                                type
                              )}
                              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                            />
                            <span className="truncate">{type}</span>
                          </label>
                        ))}
                      </div>
                      {errors.environmentCommentsType && (
                        <p className="text-red-600 text-xs mt-1">{errors.environmentCommentsType.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("teacherComment")}
                      </label>
                      <textarea
                        {...register("teacherComment")}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
                        rows={3}
                      />
                      {errors.teacherComment && (
                        <p className="text-red-600 text-xs mt-1">{errors.teacherComment.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-3 text-base px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-300 transition cursor-pointer">
                        <input
                          type="checkbox"
                          {...register("providedClearFeedback")}
                          className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                        />
                        <span>{t("clearFeedback")}</span>
                      </label>
                      {errors.providedClearFeedback && (
                        <p className="text-red-600 text-xs mt-1">{errors.providedClearFeedback.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        {t("feedbackQualityLabel")}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {tt("feedbackQuality").map((quality) => (
                          <label
                            key={quality}
                            className="flex items-center gap-3 text-sm px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 hover:border-sky-300 transition cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={watch("feedbackQuality").includes(
                                quality
                              )}
                              onChange={handleCheckboxArray(
                                "feedbackQuality",
                                quality
                              )}
                              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                            />
                            <span className="truncate">{quality}</span>
                          </label>
                        ))}
                      </div>
                      {errors.feedbackQuality && (
                        <p className="text-red-600 text-xs mt-1">{errors.feedbackQuality.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("studentsNeedingHelp")}
                      </label>
                      <textarea
                        {...register("studentsNeedingHelp")}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
                        rows={3}
                      />
                      {errors.studentsNeedingHelp && (
                        <p className="text-red-600 text-xs mt-1">{errors.studentsNeedingHelp.message}</p>
                      )}
                    </div>
                  </div>
                </section>

                <div className="border-t border-dashed border-slate-200" />

                {/* المنصة الرقمية */}
                <section className="space-y-6">
                  <h2 className="text-xl md:text-2xl font-semibold mb-2 text-teal-700 flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 text-lg font-bold">
                      3
                    </span>
                    {t("digitalPlatform")}
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        {t("platformLevelLabel")}
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 text-base px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition cursor-pointer">
                          <input
                            type="radio"
                            value="IXL"
                            {...register("platformLevel")}
                            className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                          />
                          <span>{t("ixl")}</span>
                        </label>
                        <label className="flex items-center gap-3 text-base px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition cursor-pointer">
                          <input
                            type="radio"
                            value="Apex Learning"
                            {...register("platformLevel")}
                            className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                          />
                          <span>{t("apex")}</span>
                        </label>
                      </div>
                      {errors.platformLevel && (
                        <p className="text-red-600 text-xs mt-1">{errors.platformLevel.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-3 text-base px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-300 transition cursor-pointer">
                        <input
                          type="checkbox"
                          {...register("usedDigitalPlatform")}
                          className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                        />
                        <span>{t("usedPlatform")}</span>
                      </label>
                      {errors.usedDigitalPlatform && (
                        <p className="text-red-600 text-xs mt-1">{errors.usedDigitalPlatform.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("gradesScreenshot")}
                      </label>
                      <input
                        type="file"
                        {...register("gradesBookScreenshot")}
                        className="w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-teal-50 file:text-teal-700 file:font-medium hover:file:bg-teal-100 border border-dashed border-slate-300 rounded-xl bg-slate-50/60 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-3 text-base px-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-300 transition cursor-pointer">
                        <input
                          type="checkbox"
                          {...register("monitoredAssignments")}
                          className="w-5 h-5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                        />
                        <span>{t("monitoredAssignments")}</span>
                      </label>
                      {errors.monitoredAssignments && (
                        <p className="text-red-600 text-xs mt-1">{errors.monitoredAssignments.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("assignmentsScreenshot")}
                      </label>
                      <input
                        type="file"
                        {...register("assignmentsScreenshot")}
                        className="w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-teal-50 file:text-teal-700 file:font-medium hover:file:bg-teal-100 border border-dashed border-slate-300 rounded-xl bg-slate-50/60 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("aiTutor")}
                      </label>
                      <textarea
                        {...register("aiTutorComment")}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
                        rows={3}
                      />
                      {errors.aiTutorComment && (
                        <p className="text-red-600 text-xs mt-1">{errors.aiTutorComment.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("readingProgress")}
                      </label>
                      <textarea
                        {...register("readingProgressComment")}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
                        rows={3}
                      />
                      {errors.readingProgressComment && (
                        <p className="text-red-600 text-xs mt-1">{errors.readingProgressComment.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("exactPath")}
                      </label>
                      <textarea
                        {...register("exactPathComment")}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
                        rows={3}
                      />
                      {errors.exactPathComment && (
                        <p className="text-red-600 text-xs mt-1">{errors.exactPathComment.message}</p>
                      )}
                    </div>
                  </div>
                </section>

                <div className="border-t border-dashed border-slate-200" />

                {/* مراقبة أداء الطلاب */}
                <section className="space-y-6">
                  <h2 className="text-xl md:text-2xl font-semibold mb-2 text-teal-700 flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 text-lg font-bold">
                      4
                    </span>
                    {t("studentMonitoring")}
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        {t("atRiskReasonsLabel")}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {tt("atRiskReasons").map((reason) => (
                          <label
                            key={reason}
                            className="flex items-center gap-3 text-sm px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 hover:border-rose-300 transition cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={watch(
                                "atRiskStudentsReasons"
                              ).includes(reason)}
                              onChange={handleCheckboxArray(
                                "atRiskStudentsReasons",
                                reason
                              )}
                              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                            />
                            <span className="truncate">{reason}</span>
                          </label>
                        ))}
                      </div>
                      {errors.atRiskStudentsReasons && (
                        <p className="text-red-600 text-xs mt-1">{errors.atRiskStudentsReasons.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("atRiskNames")}
                      </label>
                      <textarea
                        {...register("atRiskStudentsNames")}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
                        rows={3}
                      />
                      {errors.atRiskStudentsNames && (
                        <p className="text-red-600 text-xs mt-1">{errors.atRiskStudentsNames.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        {t("highPerformReasonsLabel")}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {tt("highPerformReasons").map((reason) => (
                          <label
                            key={reason}
                            className="flex items-center gap-3 text-sm px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={watch(
                                "highPerformingStudentsReasons"
                              ).includes(reason)}
                              onChange={handleCheckboxArray(
                                "highPerformingStudentsReasons",
                                reason
                              )}
                              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                            />
                            <span className="truncate">{reason}</span>
                          </label>
                        ))}
                      </div>
                      {errors.highPerformingStudentsReasons && (
                        <p className="text-red-600 text-xs mt-1">{errors.highPerformingStudentsReasons.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("highPerformNames")}
                      </label>
                      <textarea
                        {...register("highPerformingStudentsNames")}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
                        rows={3}
                      />
                      {errors.highPerformingStudentsNames && (
                        <p className="text-red-600 text-xs mt-1">{errors.highPerformingStudentsNames.message}</p>
                      )}
                    </div>
                  </div>
                </section>

                <div className="border-t border-dashed border-slate-200" />

                {/* المشاكل */}
                <section className="space-y-6">
                  <h2 className="text-xl md:text-2xl font-semibold mb-2 text-teal-700 flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 text-lg font-bold">
                      5
                    </span>
                    {t("issuesSection")}
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        {t("issuesLabel")}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {tt("issues").map((issue) => (
                          <label
                            key={issue}
                            className="flex items-center gap-3 text-sm px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-300 transition cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={watch("issues").includes(issue)}
                              onChange={handleCheckboxArray("issues", issue)}
                              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                            />
                            <span className="truncate">{issue}</span>
                          </label>
                        ))}
                      </div>
                      {errors.issues && (
                        <p className="text-red-600 text-xs mt-1">{errors.issues.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("mainChallenge")}
                      </label>
                      <textarea
                        {...register("mainChallenge")}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
                        rows={3}
                      />
                      {errors.mainChallenge && (
                        <p className="text-red-600 text-xs mt-1">{errors.mainChallenge.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("supportNeeded")}
                      </label>
                      <textarea
                        {...register("supportNeeded")}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
                        rows={3}
                      />
                      {errors.supportNeeded && (
                        <p className="text-red-600 text-xs mt-1">{errors.supportNeeded.message}</p>
                      )}
                    </div>
                  </div>
                </section>

                <div className="border-t border-dashed border-slate-200" />

                {/* التوقيع */}
                <section className="space-y-6">
                  <h2 className="text-xl md:text-2xl font-semibold mb-2 text-teal-700 flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 text-lg font-bold">
                      6
                    </span>
                    {t("signature")}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("teacherSignature")}
                      </label>
                      <input
                        {...register("teacherSignature")}
                        placeholder={t("signaturePlaceholder")}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                      />
                      {errors.teacherSignature && (
                        <p className="text-red-600 text-xs mt-1">
                          {errors.teacherSignature.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {t("signatureDate")}
                      </label>
                      <input
                        type="date"
                        {...register("signatureDate")}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/60 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                      />
                      {errors.signatureDate && (
                        <p className="text-red-600 text-xs mt-1">
                          {errors.signatureDate.message}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 via-emerald-500 to-sky-500 hover:from-teal-700 hover:via-emerald-600 hover:to-sky-600 text-white font-semibold py-4 rounded-2xl text-lg shadow-lg shadow-teal-500/30 transition disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                        <span>{t("submitting") || "جاري الإرسال..."}</span>
                      </>
                    ) : (
                      <span>{t("submit") || "إرسال التقرير"}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 scale-100">
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-8 text-white text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/20 flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-2">تم الإرسال بنجاح!</h2>
              <p className="text-teal-100 opacity-90">
                تقريرك الأسبوعي تم حفظه بنجاح
              </p>
            </div>

            <div className="p-8 text-center">
              <p className="text-gray-600 mb-8 text-lg">
                شكراً لجهودك المتميزة!
                <br />
                سيتم إعادة توجيهك إلى لوحة التحكم خلال ثوانٍ...
              </p>

              <button
                onClick={() => router.push("/dashboard/teacher")}
                className="bg-teal-600 hover:bg-teal-700 text-white px-10 py-4 rounded-xl font-medium text-lg transition transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-300"
              >
                العودة إلى لوحة التحكم الآن
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
