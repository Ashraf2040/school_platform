"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

// --- Types (Kept intact) ---
type Teacher = {
  id: string;
  name: string;
  username: string;
  teacherProfile?: {
    jobTitle?: string;
    specialty?: string;
    schoolName?: string;
  };
};

type AcademicYear = {
  id: string;
  name: string;
  isCurrent: boolean;
};

type Inquest = {
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

// --- Principal Opinion Options (New) ---
const PRINCIPAL_OPINION_OPTIONS = [
  "Excuse accepted",
  "Alert",
  "Draw attention",
  "Deduction for NOT accepting this excuse",
];

export default function AdminInquestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  
  // --- Filter States (Modified/New) ---
  const [filterYearId, setFilterYearId] = useState<string>("");
  const [filterTeacherId, setFilterTeacherId] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  
  const [inquests, setInquests] = useState<Inquest[]>([]);
  const [selectedInquest, setSelectedInquest] = useState<Inquest | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [pending, setPending] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  // --- Form States (Kept intact) ---
  const [form, setForm] = useState({
    inquestType: "ABSENT" as "ABSENT" | "NEGLIGENCE",
    reason: "",
    details: "",
    teacherJobTitle: "",
    teacherSpecialty: "",
    teacherSchool: "",
    clarificationRequest: "",
  });

  const [decisionForm, setDecisionForm] = useState({
    principalOpinion: "",
    decisionText: "",
  });

  // --- Auth Check (Kept intact) ---
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/login");
    } else if (session.user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  // --- Initial Data Load (Modified to set filterYearId) ---
  useEffect(() => {
    const load = async () => {
      try {
        const [teachersRes, yearsRes] = await Promise.all([
          fetch("/api/admin/teachers"),
          fetch("/api/academic-years"),
        ]);
        const teachersData = await teachersRes.json();
        const yearsData = await yearsRes.json();
        setTeachers(teachersData);
        setYears(yearsData);
        const current = yearsData.find((y: AcademicYear) => y.isCurrent);
        if (current) setFilterYearId(current.id); // Set current year as default filter
      } catch {
        toast.error("Failed to load initial data");
      }
    };
    load();
  }, []);

  // --- Load All Inquests (Modified to load all and filter locally) ---
  const [allInquests, setAllInquests] = useState<Inquest[]>([]);
  
  useEffect(() => {
    const loadInquests = async () => {
      try {
        const res = await fetch(`/api/admin/inquests`);
        if (!res.ok) throw new Error("Failed to fetch inquests");
        const data = await res.json();
        setAllInquests(data);
      } catch (e: any) {
        toast.error(e.message || "Failed to load inquests");
      }
    };
    loadInquests();
  }, []);

  // --- Apply Filters Locally ---
  useEffect(() => {
    let filtered = [...allInquests];

    // Filter by year
    if (filterYearId) {
      filtered = filtered.filter((i) => i.academicYear.id === filterYearId);
    }

    // Filter by teacher
    if (filterTeacherId) {
      filtered = filtered.filter((i) => i.teacher.id === filterTeacherId);
    }

    // Filter by month
    if (filterMonth) {
      filtered = filtered.filter((i) => {
        const inquestDate = new Date(i.createdAt);
        const inquestMonth = `${inquestDate.getFullYear()}-${String(inquestDate.getMonth() + 1).padStart(2, '0')}`;
        return inquestMonth === filterMonth;
      });
    }

    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter((i) => i.status === filterStatus);
    }

    setInquests(filtered);
    setSelectedInquest(null);
  }, [allInquests, filterYearId, filterTeacherId, filterMonth, filterStatus]);

  // --- Auto-fill Teacher Info for New Inquest (Modified to use filterTeacherId) ---
  useEffect(() => {
    if (filterTeacherId) {
      const teacher = teachers.find((t) => t.id === filterTeacherId);
      if (teacher?.teacherProfile) {
        setForm((prev) => ({
          ...prev,
          teacherJobTitle: teacher.teacherProfile?.jobTitle || "",
          teacherSpecialty: teacher.teacherProfile?.specialty || "",
          teacherSchool: teacher.teacherProfile?.schoolName || "",
        }));
      }
    }
  }, [filterTeacherId, teachers]);

  // --- Decision Form Pre-fill (Kept intact) ---
  useEffect(() => {
    if (selectedInquest && selectedInquest.status === "RESPONDED") {
      setDecisionForm({
        principalOpinion: selectedInquest.principalOpinion || "",
        decisionText: selectedInquest.decisionText || "",
      });
    }
  }, [selectedInquest]);

  // --- Handle Create Submit (Modified to use filterYearId and filterTeacherId) ---
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterTeacherId || !filterYearId) {
      toast.error("Select academic year and teacher first");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/admin/inquests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: filterTeacherId,
          academicYearId: filterYearId,
          ...form,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to create inquest");
      }
      toast.success("Inquest created and notification sent");
      setForm({
        inquestType: "ABSENT",
        reason: "",
        details: "",
        teacherJobTitle: "",
        teacherSpecialty: "",
        teacherSchool: "",
        clarificationRequest: "",
      });
      setShowForm(false);

      // Re-fetch all inquests to update the list
      const updated = await fetch(`/api/admin/inquests`).then((r) => r.json());
      setAllInquests(updated);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPending(false);
    }
  };

  // --- Handle Decision Submit (Modified to use the new filter logic for re-fetch) ---
  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquest) return;

    setPending(true);
    try {
      const res = await fetch(`/api/inquests/${selectedInquest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...decisionForm,
          status: "COMPLETED",
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update inquest");
      }
      toast.success("Decision saved and inquest completed");
      setShowDecisionForm(false);

      // Re-fetch all inquests to update the list
      const updated = await fetch(`/api/admin/inquests`).then((r) => r.json());
      setAllInquests(updated);
      const updatedInquest = updated.find((i: Inquest) => i.id === selectedInquest.id);
      setSelectedInquest(updatedInquest);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPending(false);
    }
  };

  // --- PDF Generation (Kept intact) ---
  const handlePreview = () => {
    setShowPDFPreview(true);
  };

  const generatePDF = async () => {
    if (!selectedInquest || generatingPDF) return;

    setGeneratingPDF(true);
    const loadingId = toast.loading("Generating PDF... Please wait");

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const previewElement = document.getElementById("pdf-preview-template");
      if (!previewElement) throw new Error("Preview element not found");

      const canvas = await html2canvas(previewElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: true,
        windowWidth: previewElement.scrollWidth + 200,
        windowHeight: previewElement.scrollHeight + 200,
      });

      console.log("Canvas size:", canvas.width, "x", canvas.height);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(
        `Inquest_${selectedInquest.teacher.name.replace(/\s+/g, "_")}_${new Date(
          selectedInquest.createdAt
        ).toLocaleDateString("en-GB")}.pdf`
      );

      toast.dismiss(loadingId);
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.dismiss(loadingId);
      toast.error("Failed to generate PDF. Check console.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // --- Helper for Month/Year filter options ---
  const getMonthOptions = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleString('en-US', { year: 'numeric', month: 'long' });
      months.push({ value, label });
    }
    return months;
  }, []);

  // --- Render ---
  return (
    <div className="mx-auto w-full py-8 px-6 space-y-8 font-['Noto_Sans_Arabic',sans-serif]">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Teachers Inquests</h1>
        <p className="mt-2 text-base text-slate-600">
          Create, review, and manage teacher inquests efficiently.
        </p>
      </div>

      {/* Filters (Modified to include all new filters) */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
        <div className="grid gap-5 md:grid-cols-5">
          {/* Academic Year Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Academic Year</label>
            <select
              value={filterYearId}
              onChange={(e) => setFilterYearId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
            >
              <option value="">All Years</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.isCurrent ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter (New) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
            >
              <option value="">All Months</option>
              {getMonthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Teacher Filter (Modified to be a filter, not a prerequisite) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teacher</label>
            <select
              value={filterTeacherId}
              onChange={(e) => setFilterTeacherId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
            >
              <option value="">All Teachers</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.username})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter (New) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="RESPONDED">RESPONDED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          {/* Create New Button (Modified to work without pre-selection) */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setShowForm(true);
                setSelectedInquest(null);
                setShowDecisionForm(false);
                setShowPDFPreview(false);
              }}
              className="w-full rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-teal-600 transition"
            >
              Create New Inquest
            </button>
          </div>
        </div>
      </div>

      {/* Main Content (Modified to show all inquests in a table) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inquests List (Replaced with a full-width table) */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              All Inquests ({inquests.length})
            </h2>
            <p className="text-sm text-slate-500">
              Click on a row to view details or add a decision.
            </p>
          </div>
          
          {/* Inquests Table (New) */}
          <div className="overflow-x-auto max-h-[600px]">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {inquests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">
                      No inquests found matching the current filters.
                    </td>
                  </tr>
                ) : (
                  inquests.map((inquest) => (
                    <tr
                      key={inquest.id}
                      onClick={() => {
                        setSelectedInquest(inquest);
                        setShowForm(false);
                        setShowDecisionForm(false);
                        setShowPDFPreview(false);
                      }}
                      className={`cursor-pointer hover:bg-teal-50 transition ${
                        selectedInquest?.id === inquest.id ? "bg-teal-100" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {new Date(inquest.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {inquest.teacher.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {inquest.inquestType === "ABSENT" ? "Absence" : "Negligence"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                        {inquest.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            inquest.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : inquest.status === "RESPONDED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {inquest.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {inquest.status === "RESPONDED" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click
                              setSelectedInquest(inquest);
                              setShowDecisionForm(true);
                            }}
                            className="text-teal-600 hover:text-teal-900"
                          >
                            Add Decision
                          </button>
                        )}
                        {inquest.status === "COMPLETED" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click
                              setSelectedInquest(inquest);
                              handlePreview();
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Preview
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inquest Details / Forms */}
        <div className="lg:col-span-3">
          {/* Detail/Form View (Moved to a separate container to manage layout) */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-200">
            {showForm ? (
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-slate-900">Create New Inquest</h2>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-sm text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleCreateSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Academic Year *</label>
                      <select
                        value={filterYearId}
                        onChange={(e) => setFilterYearId(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
                      >
                        <option value="">Select Year...</option>
                        {years.map((y) => (
                          <option key={y.id} value={y.id}>
                            {y.name} {y.isCurrent ? "(Current)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Teacher *</label>
                      <select
                        value={filterTeacherId}
                        onChange={(e) => setFilterTeacherId(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
                      >
                        <option value="">Select Teacher...</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.username})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Inquest Type</label>
                    <select
                      value={form.inquestType}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          inquestType: e.target.value as "ABSENT" | "NEGLIGENCE",
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
                    >
                      <option value="ABSENT">Absence</option>
                      <option value="NEGLIGENCE">Negligence</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                    <input
                      type="text"
                      value={form.reason}
                      onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                      required
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Details (Optional)</label>
                    <textarea
                      value={form.details}
                      onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dir-auto"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Clarification Request</label>
                    <textarea
                      value={form.clarificationRequest}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, clarificationRequest: e.target.value }))
                      }
                      rows={3}
                      required
                      placeholder="What clarification is requested from the teacher?"
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dir-auto"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                      <input
                        type="text"
                        value={form.teacherJobTitle}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, teacherJobTitle: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Specialty</label>
                      <input
                        type="text"
                        value={form.teacherSpecialty}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, teacherSpecialty: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">School</label>
                      <input
                        type="text"
                        value={form.teacherSchool}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, teacherSchool: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-medium text-white shadow hover:bg-teal-700 disabled:opacity-60 transition"
                    >
                      {pending ? "Saving..." : "Save Inquest"}
                    </button>
                  </div>
                </form>
              </div>
            ) : showDecisionForm ? (
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-slate-900">Add Final Decision</h2>
                  <button
                    type="button"
                    onClick={() => setShowDecisionForm(false)}
                    className="text-sm text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleDecisionSubmit} className="space-y-5">
                  {/* Principal Opinion Select Box (New) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Principal Opinion</label>
                    <select
                      value={decisionForm.principalOpinion}
                      onChange={(e) =>
                        setDecisionForm((f) => ({ ...f, principalOpinion: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
                    >
                      <option value="">Select an opinion...</option>
                      {PRINCIPAL_OPINION_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Final Decision Text</label>
                    <textarea
                      value={decisionForm.decisionText}
                      onChange={(e) =>
                        setDecisionForm((f) => ({ ...f, decisionText: e.target.value }))
                      }
                      rows={4}
                      placeholder="Final outcome or action..."
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dir-auto"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-medium text-white shadow hover:bg-teal-700 disabled:opacity-60 transition"
                    >
                      {pending ? "Saving..." : "Save Decision"}
                    </button>
                  </div>
                </form>
              </div>
            ) : showPDFPreview && selectedInquest ? (
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-slate-900">PDF Preview</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowPDFPreview(false)}
                      className="rounded-lg bg-gray-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-gray-700 transition"
                    >
                      Close
                    </button>
                    <button
                      onClick={generatePDF}
                      disabled={generatingPDF}
                      className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-60 transition"
                    >
                      {generatingPDF ? "Generating..." : "Download"}
                    </button>
                  </div>
                </div>

                {/* PDF Template (Modified for better styling/layout) */}
                <div
                  id="pdf-preview-template"
                  className="bg-white p-10 border border-gray-300 shadow-lg" // Added shadow and border for visual enhancement
                  style={{
                    width: "280mm",
                    minHeight: "297mm",
                    margin: "0 auto",
                    fontFamily: "'Noto Sans Arabic', Arial, sans-serif",
                    fontSize: "12px",
                    lineHeight: "1.6",
                    color: "#1a1a1a",
                  }}
                >
                  {/* Enhanced Header */}
                  <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "20px", borderBottom: "3px solid #0891b2", paddingBottom: "10px", marginBottom: "20px", color: "#0891b2" }}>
                    AL FORQAN PRIVATE SCHOOL- AMERICAN DIVISION
                  </div>
                  <div style={{ textAlign: "center", fontSize: "16px", marginBottom: "10px", fontWeight: "600", color: "#0e7490" }}>
                    Academic Year {selectedInquest.academicYear.name}
                  </div>
                  <div style={{ textAlign: "center", fontSize: "28px", fontWeight: "bold", marginBottom: "30px", color: "#0891b2", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Inquest مسائلة
                  </div>

                  {/* Teacher Info - 4 Columns Layout */}
                  <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "25px" }}>
                    <tbody>
                      <tr>
                        <td style={{ border: "2px solid #0891b2", padding: "10px", fontWeight: "bold", width: "15%", backgroundColor: "#cffafe", textAlign: "center" }}>الاسم<br/>Name</td>
                        <td style={{ border: "2px solid #0891b2", padding: "10px", width: "35%" }}>{selectedInquest.teacher.name}</td>
                        <td style={{ border: "2px solid #0891b2", padding: "10px", fontWeight: "bold", width: "15%", backgroundColor: "#cffafe", textAlign: "center" }}>الوظيفة<br/>Job</td>
                        <td style={{ border: "2px solid #0891b2", padding: "10px", width: "35%" }}>
                          {selectedInquest.teacherJobTitle || "غير محدد"}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ border: "2px solid #0891b2", padding: "10px", fontWeight: "bold", backgroundColor: "#cffafe", textAlign: "center" }}>التخصص<br/>Specialty</td>
                        <td style={{ border: "2px solid #0891b2", padding: "10px" }}>
                          {selectedInquest.teacherSpecialty || "غير محدد"}
                        </td>
                        <td style={{ border: "2px solid #0891b2", padding: "10px", fontWeight: "bold", backgroundColor: "#cffafe", textAlign: "center" }}>التاريخ<br/>Date</td>
                        <td style={{ border: "2px solid #0891b2", padding: "10px" }}>
                          {new Date(selectedInquest.createdAt).toLocaleDateString("en-GB")}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Section 1: Clarification Request */}
                  <div style={{ border: "3px solid #0891b2", marginBottom: "25px", borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{ background: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)", color: "white", padding: "12px", fontWeight: "bold", fontSize: "18px", textAlign: "center" }}>
                      1- Clarification Request / طلب إيضاح
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          <td style={{ width: "50%", padding: "10px", verticalAlign: "top", borderRight: "1px solid #047857" }}>
                            {/* <p style={{ fontWeight: "bold", marginBottom: "5px" }}>Clarification request:</p> */}
                            <p>Venerable / {selectedInquest.teacher.name}</p>
                            <p>The follow up reveals that:</p>
                            <div style={{ minHeight: "120px", border: "1px dashed #ccc", padding: "5px", marginTop: "5px", backgroundColor: "#f9f9f9" }}>
                              {selectedInquest.reason && <div><strong>Reason:</strong> {selectedInquest.reason.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                              {selectedInquest.details && <div><strong>Details:</strong> {selectedInquest.details.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                              {selectedInquest.clarificationRequest && <div><strong>Request:</strong> {selectedInquest.clarificationRequest.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                            </div>
                            {/* <p style={{ marginTop: "10px" }}>Signature: ......................... Date: __ / __ / {new Date(selectedInquest.createdAt).getFullYear()}</p> */}
                          </td>
                          <td style={{ width: "50%", padding: "10px", direction: "rtl", verticalAlign: "top" }}>
                            {/* <p style={{ fontWeight: "bold", marginBottom: "5px" }}>طلب إيضاح:</p> */}
                            <p>المكرم / {selectedInquest.teacher.name}</p>
                            <p>من خلال المتابعة :</p>
                            <div style={{ minHeight: "120px", border: "1px dashed #ccc", padding: "5px", marginTop: "5px", backgroundColor: "#f9f9f9" }}>
                              {selectedInquest.reason && <div><strong>السبب:</strong> {selectedInquest.reason.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                              {selectedInquest.details && <div><strong>التفاصيل:</strong> {selectedInquest.details.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                              {selectedInquest.clarificationRequest && <div><strong>طلب التوضيح:</strong> {selectedInquest.clarificationRequest.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                            </div>
                            {/* <p style={{ marginTop: "10px" }}>التوقيع: ......................... التاريخ: {new Date(selectedInquest.createdAt).getFullYear()} / __ / __</p> */}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Section 2: Teacher Clarification */}
                  <div style={{ border: "3px solid #10b981", marginBottom: "25px", borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white", padding: "12px", fontWeight: "bold", fontSize: "18px", textAlign: "center" }}>
                      2- Clarification / الإيضاح
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          <td style={{ width: "50%", padding: "15px", verticalAlign: "top", borderRight: "2px solid #10b981" }}>
                            {/* <p style={{ fontWeight: "bold", marginBottom: "5px" }}>Clarification:</p> */}
                          <div className="flex justify-between items-center">
                              <p>Venerable Principal /</p>
                            <p>Greetings</p>
                          </div>
                            <div style={{ 
                              minHeight: selectedInquest.teacherClarification ? `${Math.max(80, selectedInquest.teacherClarification.length / 3)}px` : "80px", 
                              border: "2px solid #d1fae5", 
                              padding: "10px", 
                              marginTop: "8px", 
                              backgroundColor: "#f0fdf4",
                              borderRadius: "4px"
                            }}>
                              {selectedInquest.teacherClarification?.split('\n').map((line, i) => <div key={i} style={{ marginBottom: "4px" }}>{line}</div>)}
                            </div>
                            <p style={{ marginTop: "10px" }}>Name: {selectedInquest.teacher.name}</p>
                            <p>Signature: ......................... </p>
                            <p>Date: __ / __ / {new Date(selectedInquest.createdAt).getFullYear()}</p>
                          </td>
                          <td style={{ width: "50%", padding: "15px", direction: "rtl", verticalAlign: "top" }}>
                            <div className="flex justify-between items-center">
                              {/* <p style={{ fontWeight: "bold", marginBottom: "5px" }}>الإيضاح:</p> */}
                            <p>المكرم قائد المدرسة /</p>
                            <p>تحية طيبة وبعد</p>
                            </div>
                            <div style={{ 
                              minHeight: selectedInquest.teacherClarification ? `${Math.max(80, selectedInquest.teacherClarification.length / 3)}px` : "80px", 
                              border: "2px solid #d1fae5", 
                              padding: "10px", 
                              marginTop: "8px", 
                              backgroundColor: "#f0fdf4",
                              borderRadius: "4px"
                            }}>
                              {selectedInquest.teacherClarification?.split('\n').map((line, i) => <div key={i} style={{ marginBottom: "4px" }}>{line}</div>)}
                            </div>
                            <p style={{ marginTop: "10px" }}>الاسم: {selectedInquest.teacher.name}</p>
                            <p>التوقيع: ......................... </p>
                            <p>التاريخ: {new Date(selectedInquest.createdAt).getFullYear()} / __ / __</p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Section 3: Principal's Opinion and Decision */}
                  <div style={{ border: "3px solid #f59e0b", marginBottom: "25px", borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "white", padding: "12px", fontWeight: "bold", fontSize: "18px", textAlign: "center" }}>
                      3- Principal's Opinion and Decision / رأي وقرار قائد المدرسة
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          <td style={{ width: "50%", padding: "15px", verticalAlign: "top", borderRight: "2px solid #f59e0b" }}>
                            <p style={{ fontWeight: "bold", marginBottom: "10px", fontSize: "14px" }}>Principal's Opinion:</p>
                            {selectedInquest.principalOpinion && (
                              <div style={{ 
                                backgroundColor: "#fef3c7", 
                                border: "2px solid #fbbf24", 
                                padding: "12px", 
                                borderRadius: "6px",
                                marginBottom: "15px",
                                fontWeight: "600",
                                fontSize: "13px"
                              }}>
                                ☑ {selectedInquest.principalOpinion}
                              </div>
                            )}
                            <p style={{ fontWeight: "bold", marginTop: "15px", fontSize: "14px" }}>Final Decision:</p>
                            <div style={{ 
                              backgroundColor: "#fffbeb", 
                              border: "2px solid #fbbf24", 
                              padding: "12px", 
                              borderRadius: "6px",
                              marginTop: "8px",
                              minHeight: "60px"
                            }}>
                              {selectedInquest.decisionText || ""}
                            </div>
                            <p style={{ marginTop: "20px", fontWeight: "600" }}>Principal: Mr. Abdellah Shaker Alghamdi</p>
                            <p>Signature: ......................... </p>
                            <p>Date: __ / __ / {new Date(selectedInquest.createdAt).getFullYear()}</p>
                          </td>
                          <td style={{ width: "50%", padding: "15px", direction: "rtl", verticalAlign: "top" }}>
                            <p style={{ fontWeight: "bold", marginBottom: "10px", fontSize: "14px" }}>رأي قائد المدرسة:</p>
                            {selectedInquest.principalOpinion && (
                              <div style={{ 
                                backgroundColor: "#fef3c7", 
                                border: "2px solid #fbbf24", 
                                padding: "12px", 
                                borderRadius: "6px",
                                marginBottom: "15px",
                                fontWeight: "600",
                                fontSize: "13px"
                              }}>
                                ☑ {selectedInquest.principalOpinion}
                              </div>
                            )}
                            <p style={{ fontWeight: "bold", marginTop: "15px", fontSize: "14px" }}>القرار النهائي:</p>
                            <div style={{ 
                              backgroundColor: "#fffbeb", 
                              border: "2px solid #fbbf24", 
                              padding: "12px", 
                              borderRadius: "6px",
                              marginTop: "8px",
                              minHeight: "60px"
                            }}>
                              {selectedInquest.decisionText || ""}
                            </div>
                            <p style={{ marginTop: "20px", fontWeight: "600" }}>قائد المدرسة : أ/ عبد الله شاكر الغامدي</p>
                            <p>التوقيع: ......................... </p>
                            <p>التاريخ: {new Date(selectedInquest.createdAt).getFullYear()} / __ / __</p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* <div style={{ marginTop: "30px", padding: "15px", backgroundColor: "#f8fafc", border: "2px solid #cbd5e1", borderRadius: "8px" }}>
                    <p style={{ fontWeight: "bold", fontSize: "13px", color: "#475569", marginBottom: "5px" }}>Important note:</p>
                    <p style={{ fontSize: "12px", color: "#64748b" }}>The form is to be completed by the school principal and all decisions will be taken by him.</p>
                    <p style={{ direction: "rtl", fontWeight: "bold", fontSize: "13px", color: "#475569", marginTop: "10px", marginBottom: "5px" }}>ملاحظة هامة</p>
                    <p style={{ direction: "rtl", fontSize: "12px", color: "#64748b" }}>- يتم إستكمال بيانات المسائلة وإتخاذ كل القرارات من قِبل قائد المدرسة</p>
                  </div> */}
                </div>
              </div>
            ) : selectedInquest ? (
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Inquest Details</h2>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          selectedInquest.inquestType === "ABSENT"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {selectedInquest.inquestType === "ABSENT" ? "Absent" : "Negligence"}
                      </span>
                      <span
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          selectedInquest.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : selectedInquest.status === "RESPONDED"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {selectedInquest.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {selectedInquest.status === "RESPONDED" && (
                      <button
                        onClick={() => setShowDecisionForm(true)}
                        className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-teal-700 transition"
                      >
                        Add Decision
                      </button>
                    )}
                    {selectedInquest.status === "COMPLETED" && (
                      <button
                        onClick={handlePreview}
                        disabled={generatingPDF}
                        className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-60 transition"
                      >
                        Preview
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-sm space-y-4">
                  <div>
                    <span className="font-medium text-slate-700">Issued on:</span>
                    <span className="ml-2 text-slate-900">
                      {new Date(selectedInquest.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <span className="font-medium text-slate-700">Reason:</span>
                    <p className="mt-1 text-slate-900" dir="auto">{selectedInquest.reason}</p>
                  </div>

                  {selectedInquest.details && (
                    <div>
                      <span className="font-medium text-slate-700">Details:</span>
                      <p className="mt-1 text-slate-900" dir="auto">{selectedInquest.details}</p>
                    </div>
                  )}

                  {selectedInquest.clarificationRequest && (
                    <div>
                      <span className="font-medium text-slate-700">Clarification Requested:</span>
                      <p className="mt-1 text-slate-900" dir="auto">{selectedInquest.clarificationRequest}</p>
                    </div>
                  )}

                  {selectedInquest.teacherClarification && (
                    <div>
                      <span className="font-medium text-slate-700">Teacher Response:</span>
                      <p className="mt-1 text-slate-900" dir="auto">{selectedInquest.teacherClarification}</p>
                    </div>
                  )}

                  {selectedInquest.attachmentUrl && (
                    <div>
                      <span className="font-medium text-slate-700">Attachment:</span>
                      <a
                        href={selectedInquest.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-teal-600 hover:underline"
                      >
                        View PDF →
                      </a
                      >
                    </div>
                  )}

                  {selectedInquest.principalOpinion && (
                    <div>
                      <span className="font-medium text-slate-700">Principal Opinion:</span>
                      <p className="mt-1 text-slate-900" dir="auto">{selectedInquest.principalOpinion}</p>
                    </div>
                  )}

                  {selectedInquest.decisionText && (
                    <div className="bg-teal-50 rounded-lg p-4">
                      <span className="font-medium text-slate-700">Final Decision:</span>
                      <p className="mt-2 font-medium text-teal-800" dir="auto">{selectedInquest.decisionText}</p>
                    </div>
                  )}

                  <div>
                    <span className="font-medium text-slate-700">Academic Year:</span>
                    <span className="ml-2 text-slate-900">{selectedInquest.academicYear.name}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="text-5xl mb-4 opacity-20">📋</div>
                <p className="text-slate-600">Select an inquest from the table above to view details.</p>
                <p className="text-sm text-slate-500 mt-2">Use the filters to narrow down the list.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
