


"use client";

import { useMemo, useState } from "react";
import useSWR from "swr"; // 1. Import SWR
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { useTranslations } from "next-intl";

// Types
type RawReport = { id: string; weekStart: string; weekEnd: string | null };

type RawTeacher = {
  id: string;
  name: string;
  classesTaught?: { class: { id: string; name: string } }[];
  subjectsTaught?: { subject: { id: string; name: string } }[];
  weeklyReports: RawReport[];
};

type TeacherRow = {
  id: string;
  name: string;
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  latestReportId?: string;
  latestReportDate?: Date;
  reportStatus?: "recent" | "old" | "none";
};

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TeachersWeeklyEvaluations() {
  const t = useTranslations("AdminWeeklyReports");

  const { data: session, status } = useSession();
  const router = useRouter();

  // 2. Use SWR instead of useEffect/fetch
  // 'revalidateOnFocus: false' prevents reloading when you switch browser tabs
  const { data: rawTeachers = [], error, isLoading } = useSWR<RawTeacher[]>(
    session ? "/api/teachers-weekly-evaluations" : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Filter States
  const [filterName, setFilterName] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // 3. Complex Data Processing & Filtering
  const processedTeachers = useMemo(() => {
    if (!rawTeachers) return [];

    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    return rawTeachers
      .map((teacher) => {
        // A. Filter Reports by Date Range first
        let validReports = teacher.weeklyReports;
        
        if (fromDate) {
          validReports = validReports.filter(
            (r) => new Date(r.weekStart) >= fromDate
          );
        }
        if (toDate) {
          validReports = validReports.filter(
            (r) => new Date(r.weekStart) <= toDate
          );
        }

        // B. Find the latest report among the VALID reports
        // If no date filter is applied, it returns the absolute latest report
        const latestReport = validReports.sort(
          (a, b) =>
            new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
        )[0];

        // Determine status for styling (e.g., if report is older than 30 days)
        let reportStatus: "recent" | "old" | "none" = "none";
        if (latestReport) {
          const daysDiff = 
            (new Date().getTime() - new Date(latestReport.weekStart).getTime()) / 
            (1000 * 60 * 60 * 24);
          reportStatus = daysDiff > 30 ? "old" : "recent";
        }

        return {
          id: teacher.id,
          name: teacher.name,
          classes: teacher.classesTaught?.map((c) => c.class) || [],
          subjects: teacher.subjectsTaught?.map((s) => s.subject) || [],
          latestReportId: latestReport?.id,
          latestReportDate: latestReport
            ? new Date(latestReport.weekStart)
            : undefined,
          reportStatus,
          // We store a flag to know if this teacher should be shown
          // If a date range is set, and they have NO reports in that range, do we show them?
          // Usually, if filtering by time, we hide teachers who didn't report.
          hasValidReportInDateRange: dateFrom || dateTo ? !!latestReport : true,
        };
      })
      .filter((teacher) => {
        // 1. Text Filters
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

        // 2. Date Visibility Logic
        // If dates are applied, only show teachers who have a report in that range
        // If no dates applied, show everyone
        const dateMatch = teacher.hasValidReportInDateRange;

        return nameMatch && classMatch && subjectMatch && dateMatch;
      })
      .map(({ hasValidReportInDateRange, ...rest }) => rest) as TeacherRow[];
  }, [
    rawTeachers,
    filterName,
    filterClass,
    filterSubject,
    dateFrom,
    dateTo,
  ]);

  // Handle Auth
  if (status === "loading" || !session) return null;
  if ((session.user as any).role !== "ADMIN") {
    router.push("/login");
    return null;
  }

  const handleClearAll = () => {
    setFilterName("");
    setFilterClass("");
    setFilterSubject("");
    setDateFrom("");
    setDateTo("");
  };

  // Helper for relative time
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t("today");
    if (diffDays === 1) return t("yesterday");
    return t("daysAgo", { count: diffDays });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="w-full mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-6 sm:rounded-2xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white px-6 py-4 rounded-xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Text Filters */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder={t("filterTeacherName")}
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <input
                type="text"
                placeholder={t("filterClass")}
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <input
                type="text"
                placeholder={t("filterSubject")}
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow"
              />
            </div>

            {/* Date Filters */}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow"
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={handleClearAll}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {t("clearAll")}
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Loading State (Overlay) */}
          {isLoading && (
             <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-sm min-h-[200px]">
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    {t("tableHeaderTeacher")}
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    {t("tableHeaderClasses")}
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    {t("tableHeaderSubjects")}
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    {t("tableHeaderLastReport")}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    {t("tableHeaderAction")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-slate-900 font-medium">{t("noResults")}</p>
                      <p className="text-slate-500 text-sm mt-1">{t("tryAdjustFilters")}</p>
                    </td>
                  </tr>
                ) : (
                  processedTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm border border-teal-200">
                            {teacher.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">
                              {teacher.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              ID: {teacher.id.slice(-4)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {teacher.classes.length > 0 ? (
                            teacher.classes.map((c) => (
                              <span
                                key={c.id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                              >
                                {c.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-xs italic">—</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {teacher.subjects.length > 0 ? (
                            teacher.subjects.map((s) => (
                              <span
                                key={s.id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                              >
                                {s.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-xs italic">—</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {teacher.latestReportDate ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">
                              {teacher.latestReportDate.toLocaleDateString()}
                            </span>
                            <span
                              className={`text-xs mt-0.5 flex items-center gap-1 ${
                                teacher.reportStatus === "recent"
                                  ? "text-emerald-600"
                                  : "text-slate-400"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  teacher.reportStatus === "recent"
                                    ? "bg-emerald-500"
                                    : "bg-slate-300"
                                }`}
                              />
                              {getRelativeTime(teacher.latestReportDate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">
                            {t("noReport")}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {teacher.latestReportId ? (
                          <Link
                            href={`/dashboard/admin/weekly-evaluations/${teacher.latestReportId}`}
                          >
                            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all hover:shadow-md">
                              {t("viewReport")}
                              <svg className="ml-2 -mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </button>
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400 italic py-2 block">
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
