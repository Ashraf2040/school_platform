"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { useTranslations } from "next-intl";

type RawTeacher = {
  id: string;
  name: string;
  classesTaught?: { class: { id: string; name: string } }[];
  subjectsTaught?: { subject: { id: string; name: string } }[];
  weeklyReports?: { id: string; weekStart: string; weekEnd: string | null }[];
};

type TeacherRow = {
  id: string;
  name: string;
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  latestReportId?: string;
  latestReportDate?: string;
};

const transformTeachers = (raw: RawTeacher[]): TeacherRow[] =>
  raw.map((t) => ({
    id: t.id,
    name: t.name,
    classes: t.classesTaught?.map((c) => c.class) || [],
    subjects: t.subjectsTaught?.map((s) => s.subject) || [],
    latestReportId: t.weeklyReports?.[0]?.id,
    latestReportDate: t.weeklyReports?.[0]?.weekStart,
  }));

export default function TeachersWeeklyEvaluations() {
  const t = useTranslations("AdminWeeklyReports");

  const { data: session, status } = useSession();
  const router = useRouter();

  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states (what user types/selects)
  const [filterName, setFilterName] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Applied filters (only changed when user clicks Apply)
  const [appliedDateFrom, setAppliedDateFrom] = useState("");
  const [appliedDateTo, setAppliedDateTo] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      router.push("/login");
      return;
    }

    const loadTeachers = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        if (appliedDateFrom) params.append("from", appliedDateFrom);
        if (appliedDateTo) params.append("to", appliedDateTo);

        const query = params.toString() ? `?${params.toString()}` : "";
        const res = await fetch(`/api/teachers-weekly-evaluations${query}`);

        if (!res.ok) throw new Error("Failed to load teachers");

        const raw: RawTeacher[] = await res.json();
        setTeachers(transformTeachers(raw));
      } catch (err) {
        console.error("Load teachers error:", err);
        toast.error(t("loadError"));
      } finally {
        setLoading(false);
      }
    };

    loadTeachers();
  }, [status, session, router, appliedDateFrom, appliedDateTo]);

  // Client-side text filters
  const filteredTeachers = teachers.filter((teacher) => {
    const nameMatch = teacher.name
      .toLowerCase()
      .includes(filterName.toLowerCase());

    const classMatch = filterClass
      ? teacher.classes.some((c) =>
          c.name.toLowerCase().includes(filterClass.toLowerCase())
        )
      : true;

    const subjectMatch = filterSubject
      ? teacher.subjects.some((s) =>
          s.name.toLowerCase().includes(filterSubject.toLowerCase())
        )
      : true;

    return nameMatch && classMatch && subjectMatch;
  });

  const handleApplyFilters = () => {
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
  };

  const handleClearAll = () => {
    setFilterName("");
    setFilterClass("");
    setFilterSubject("");
    setDateFrom("");
    setDateTo("");
    setAppliedDateFrom("");
    setAppliedDateTo("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-5"></div>
          <p className="text-slate-600 font-medium text-lg">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-emerald-700 text-white rounded-t-2xl shadow-xl overflow-hidden">
          <div className="px-8 py-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {t("title")}
            </h1>
            <p className="mt-3 text-teal-100/90 text-lg max-w-3xl mx-auto">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Filters + Table Container */}
        <div className="bg-white rounded-b-2xl shadow-xl border border-slate-200/80 overflow-hidden">
          {/* Filters Section */}
          <div className="p-6 lg:p-8 border-b border-slate-200 bg-slate-50/70">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder={t("filterTeacherName")}
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="h-11 px-4 rounded-lg border border-slate-300 bg-white shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
              />

              <input
                type="text"
                placeholder={t("filterClass")}
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="h-11 px-4 rounded-lg border border-slate-300 bg-white shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
              />

              <input
                type="text"
                placeholder={t("filterSubject")}
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="h-11 px-4 rounded-lg border border-slate-300 bg-white shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
              />

              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-11 w-full px-4 rounded-lg border border-slate-300 bg-white shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
              />

              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-11 w-full px-4 rounded-lg border border-slate-300 bg-white shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-4 justify-end">
              <button
                onClick={handleApplyFilters}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors shadow-sm"
              >
                {t("applyFilters")}
              </button>

              <button
                onClick={handleClearAll}
                className="px-6 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors shadow-sm"
              >
                {t("clearAll")}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200">
                  <th className="px-6 py-4 font-semibold text-slate-800 text-sm uppercase tracking-wide">
                    {t("tableHeaderTeacher")}
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-800 text-sm uppercase tracking-wide">
                    {t("tableHeaderClasses")}
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-800 text-sm uppercase tracking-wide">
                    {t("tableHeaderSubjects")}
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-800 text-sm uppercase tracking-wide">
                    {t("tableHeaderLastReport")}
                  </th>
                  <th className="px-6 py-4 font-semibold text-slate-800 text-sm uppercase tracking-wide text-right">
                    {t("tableHeaderAction")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-500">
                      <p className="text-xl font-medium">{t("noResults")}</p>
                      <p className="mt-3">{t("tryAdjustFilters")}</p>
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher, index) => (
                    <tr
                      key={teacher.id}
                      className={`
                        border-b border-slate-100 transition-colors duration-150
                        ${index % 2 === 0 ? "bg-white" : "bg-slate-50/40"}
                        hover:bg-teal-50/60
                      `}
                    >
                      <td className="px-6 py-5 font-medium text-slate-900">
                        {teacher.name}
                      </td>
                      <td className="px-6 py-5 text-slate-700">
                        {teacher.classes.map((c) => c.name).join(", ") || "—"}
                      </td>
                      <td className="px-6 py-5 text-slate-700">
                        {teacher.subjects.map((s) => s.name).join(", ") || "—"}
                      </td>
                      <td className="px-6 py-5 text-slate-700 font-medium">
                        {teacher.latestReportDate
                          ? new Date(teacher.latestReportDate).toLocaleDateString()
                          : t("noReport")}
                      </td>
                      <td className="px-6 py-5 text-right">
                        {teacher.latestReportId ? (
                          <Link
                            href={`/dashboard/admin/weekly-evaluations/${teacher.latestReportId}`}
                          >
                            <button className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2">
                              {t("viewReport")}
                            </button>
                          </Link>
                        ) : (
                          <span className="text-sm text-slate-400 italic">
                            {t("noReport")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}