"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import html2canvas from "html2canvas-pro"; // or "html2canvas" if you switch
import jsPDF from "jspdf";

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

export default function AdminInquestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [inquests, setInquests] = useState<Inquest[]>([]);
  const [selectedInquest, setSelectedInquest] = useState<Inquest | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [pending, setPending] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);

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

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/login");
    } else if (session.user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [session, status, router]);

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
        if (current) setSelectedYearId(current.id);
      } catch {
        toast.error("Failed to load data");
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedTeacherId) {
      setInquests([]);
      setSelectedInquest(null);
      return;
    }
    const loadInquests = async () => {
      try {
        const res = await fetch(`/api/admin/inquests?teacherId=${selectedTeacherId}`);
        const data = await res.json();
        setInquests(data);
        setSelectedInquest(null);
      } catch {
        toast.error("Failed to load inquests");
      }
    };
    loadInquests();
  }, [selectedTeacherId]);

  useEffect(() => {
    if (selectedTeacherId) {
      const teacher = teachers.find((t) => t.id === selectedTeacherId);
      if (teacher?.teacherProfile) {
        setForm((prev) => ({
          ...prev,
          teacherJobTitle: teacher.teacherProfile?.jobTitle || "",
          teacherSpecialty: teacher.teacherProfile?.specialty || "",
          teacherSchool: teacher.teacherProfile?.schoolName || "",
        }));
      }
    }
  }, [selectedTeacherId, teachers]);

  useEffect(() => {
    if (selectedInquest && selectedInquest.status === "RESPONDED") {
      setDecisionForm({
        principalOpinion: selectedInquest.principalOpinion || "",
        decisionText: selectedInquest.decisionText || "",
      });
    }
  }, [selectedInquest]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedYearId) {
      toast.error("Select academic year and teacher first");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/admin/inquests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: selectedTeacherId,
          academicYearId: selectedYearId,
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

      const updated = await fetch(`/api/admin/inquests?teacherId=${selectedTeacherId}`).then((r) => r.json());
      setInquests(updated);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPending(false);
    }
  };

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

      const updated = await fetch(`/api/admin/inquests?teacherId=${selectedTeacherId}`).then((r) => r.json());
      setInquests(updated);
      const updatedInquest = updated.find((i: Inquest) => i.id === selectedInquest.id);
      setSelectedInquest(updatedInquest);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPending(false);
    }
  };

  const handlePreview = () => {
    setShowPDFPreview(true);
  };

  const generatePDF = async () => {
    if (!selectedInquest || generatingPDF) return;

    setGeneratingPDF(true);
    const loadingId = toast.loading("Generating PDF... Please wait");

    try {
      await new Promise((resolve) => setTimeout(resolve, 300)); // Short delay for render if needed

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

  return (
    <div className="mx-auto w-full py-8 px-6 space-y-8 font-['Noto_Sans_Arabic',sans-serif]">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Teachers Inquests</h1>
        <p className="mt-2 text-base text-slate-600">
          Create, review, and manage teacher inquests efficiently.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Academic Year</label>
            <select
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
            >
              <option value="">Select year</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.isCurrent ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teacher</label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
            >
              <option value="">Select teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.username})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setShowForm(true)}
              disabled={!selectedTeacherId || !selectedYearId}
              className="w-full rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-teal-700 disabled:bg-slate-300 disabled:text-slate-500 transition"
            >
              New Inquest
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Split View */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Inquest List */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          <div className="bg-teal-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Previous Inquests</h2>
          </div>

          <div className="p-5 max-h-80 overflow-y-auto space-y-3">
            {inquests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4 opacity-20">📋</div>
                <p className="text-slate-600">No inquests found</p>
                <p className="text-sm text-slate-500 mt-2">Select a teacher to view or create inquests.</p>
              </div>
            ) : (
              inquests.map((inq) => (
                <button
                  key={inq.id}
                  onClick={() => setSelectedInquest(inq)}
                  className={`w-full text-left rounded-lg p-4 border transition-all ${
                    selectedInquest?.id === inq.id
                      ? "border-teal-500 bg-teal-50 shadow"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2.5 py-1 rounded text-xs font-medium ${
                            inq.inquestType === "ABSENT"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {inq.inquestType === "ABSENT" ? "Absent" : "Negligence"}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded text-xs font-medium ${
                            inq.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : inq.status === "RESPONDED"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {inq.status}
                        </span>
                      </div>
                      <p className="font-medium text-slate-900">{inq.reason}</p>
                      {inq.details && (
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{inq.details}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(inq.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Details / Forms / PDF Preview */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-auto">
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
                <div className="grid gap-4 md:grid-cols-2">
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
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    >
                      <option value="ABSENT">Absent Inquest</option>
                      <option value="NEGLIGENCE">Negligence in Work</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={form.teacherJobTitle}
                      onChange={(e) => setForm((f) => ({ ...f, teacherJobTitle: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Specialty</label>
                    <input
                      type="text"
                      value={form.teacherSpecialty}
                      onChange={(e) => setForm((f) => ({ ...f, teacherSpecialty: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">School</label>
                    <input
                      type="text"
                      value={form.teacherSchool}
                      onChange={(e) => setForm((f) => ({ ...f, teacherSchool: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Reason <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={form.reason}
                    onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                    required
                    rows={3}
                    placeholder="Brief description of the issue..."
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dir-auto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Details / Follow-up</label>
                  <textarea
                    value={form.details}
                    onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                    rows={3}
                    placeholder="Additional notes..."
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dir-auto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Clarification Request</label>
                  <textarea
                    value={form.clarificationRequest}
                    onChange={(e) => setForm((f) => ({ ...f, clarificationRequest: e.target.value }))}
                    rows={2}
                    placeholder="What do you need from the teacher?"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dir-auto"
                  />
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Principal Opinion</label>
                  <textarea
                    value={decisionForm.principalOpinion}
                    onChange={(e) =>
                      setDecisionForm((f) => ({ ...f, principalOpinion: e.target.value }))
                    }
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dir-auto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Final Decision</label>
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

              <div
                id="pdf-preview-template"
                className="bg-white p-10"
                style={{
                  width: "210mm",
                  minHeight: "297mm",
                  margin: "0 auto",
                  fontFamily: "'Noto Sans Arabic', Arial, sans-serif",
                  fontSize: "12px",
                  lineHeight: "1.5",
                  color: "#000",
                }}
              >
                <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "14px" }}>
                  AL FORQAN PRIVATE SCHOOL- AMERICAN DIVISION
                </div>
                <div style={{ textAlign: "center", fontSize: "12px", marginBottom: "10px" }}>
                  Academic Year {selectedInquest.academicYear.name}
                </div>
                <div style={{ textAlign: "center", fontSize: "16px", fontWeight: "bold", marginBottom: "20px" }}>
                  Inquest مسائلة
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                  <tbody>
                    <tr>
                      <td style={{ border: "1px solid #000", padding: "5px", fontWeight: "bold" }}>الاسم Name</td>
                      <td style={{ border: "1px solid #000", padding: "5px" }}>{selectedInquest.teacher.name}</td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid #000", padding: "5px", fontWeight: "bold" }}>الوظيفة Job</td>
                      <td style={{ border: "1px solid #000", padding: "5px" }}>
                        {selectedInquest.teacherJobTitle || "غير محدد"}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: "1px solid #000", padding: "5px", fontWeight: "bold" }}>التخصص Specialty</td>
                      <td style={{ border: "1px solid #000", padding: "5px" }}>
                        {selectedInquest.teacherSpecialty || "غير محدد"}
                      </td>
                    </tr>
                    {/* <tr>
                      <td style={{ border: "1px solid #000", padding: "5px", fontWeight: "bold" }}>المدرسة School</td>
                      <td style={{ border: "1px solid #000", padding: "5px" }}>
                        {selectedInquest.teacherSchool || "غير محدد"} <br />
                        ☐ الابتدائية Elementary ☐ المتوسطة Middle ☐ الثانوية High
                      </td>
                    </tr> */}
                    <tr>
                      <td style={{ border: "1px solid #000", padding: "5px", fontWeight: "bold" }}>التاريخ Date</td>
                      <td style={{ border: "1px solid #000", padding: "5px" }}>
                        {new Date(selectedInquest.createdAt).toLocaleDateString("en-GB")}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "50%", border: "1px solid #000", padding: "10px", verticalAlign: "top", backgroundColor: "#f0fdfa" }}>
                        <p style={{ fontWeight: "bold" }}>1- Clarification request:</p>
                        <p>Venerable / {selectedInquest.teacher.name}</p>
                        <p>The follow up reveals that</p>
                        <p style={{ minHeight: "150px" }}>
                          {selectedInquest.reason && <div><strong>Reason:</strong> {selectedInquest.reason.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                          {selectedInquest.details && <div><strong>Details:</strong> {selectedInquest.details.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                          {selectedInquest.clarificationRequest && <div><strong>Request:</strong> {selectedInquest.clarificationRequest.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                        </p>
                        <p>Signature: ......................... Date: __ / __ / {new Date(selectedInquest.createdAt).getFullYear()}</p>
                      </td>
                      <td style={{ width: "50%", border: "1px solid #000", padding: "10px", direction: "rtl", verticalAlign: "top", backgroundColor: "#f0fdfa" }}>
                        <p style={{ fontWeight: "bold" }}>1- طلب إيضاح</p>
                        <p>المكرم / {selectedInquest.teacher.name}</p>
                        <p>من خلال المتابعة :</p>
                        <p style={{ minHeight: "150px" }}>
                          {selectedInquest.reason && <div><strong>السبب:</strong> {selectedInquest.reason.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                          {selectedInquest.details && <div><strong>التفاصيل:</strong> {selectedInquest.details.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                          {selectedInquest.clarificationRequest && <div><strong>طلب التوضيح:</strong> {selectedInquest.clarificationRequest.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>}
                        </p>
                        <p>التوقيع: ......................... التاريخ: {new Date(selectedInquest.createdAt).getFullYear()} / __ / __</p>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "50%", border: "1px solid #000", padding: "10px", verticalAlign: "top", backgroundColor: "#e6fffa" }}>
                        <p style={{ fontWeight: "bold" }}>2- Clarification:</p>
                        <p>Venerable Principal /</p>
                        <p>Greetings</p>
                        <p style={{ minHeight: "150px" }}>
                          {selectedInquest.teacherClarification?.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                        </p>
                        <p>Name: {selectedInquest.teacher.name}</p>
                        <p>Signature: ......................... </p>
                        <p>Date: __ / __ / {new Date(selectedInquest.createdAt).getFullYear()}</p>
                      </td>
                      <td style={{ width: "50%", border: "1px solid #000", padding: "10px", direction: "rtl", verticalAlign: "top", backgroundColor: "#e6fffa" }}>
                        <p style={{ fontWeight: "bold" }}>2- الإيضاح:</p>
                        <p>المكرم قائد المدرسة /</p>
                        <p>تحية طيبة وبعد</p>
                        <p style={{ minHeight: "150px" }}>
                          {selectedInquest.teacherClarification?.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                        </p>
                        <p>الاسم: {selectedInquest.teacher.name}</p>
                        <p>التوقيع: ......................... </p>
                        <p>التاريخ: {new Date(selectedInquest.createdAt).getFullYear()} / __ / __</p>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "50%", border: "1px solid #000", padding: "10px", verticalAlign: "top", backgroundColor: "#fffbeb" }}>
                        <p style={{ fontWeight: "bold" }}>3- Principal’s Opinion:</p>
                        <p>☐ Excuse accepted ☐ Alert</p>
                        <p>☐ Draw attention</p>
                        <p>☐ Deduction for NOT accepting this excuse</p>
                        <p style={{ fontWeight: "bold" }}>Opinion: {selectedInquest.principalOpinion || ""}</p>
                        <p style={{ fontWeight: "bold" }}>Final Decision: {selectedInquest.decisionText || ""}</p>
                        <p>Principal: Mr. Abdellah Shaker Alghamdi</p>
                        <p>Signature: ......................... </p>
                        <p>Date: __ / __ / {new Date(selectedInquest.createdAt).getFullYear()}</p>
                      </td>
                      <td style={{ width: "50%", border: "1px solid #000", padding: "10px", direction: "rtl", verticalAlign: "top", backgroundColor: "#fffbeb" }}>
                        <p style={{ fontWeight: "bold" }}>3- رأي قائد المدرس :</p>
                        <p>☐ عذر مقبول ☐ تنبيه</p>
                        <p>☐ لفت نظر</p>
                        <p>☐ حسم لعدم قبول العذر</p>
                        <p style={{ fontWeight: "bold" }}>رأي: {selectedInquest.principalOpinion || ""}</p>
                        <p style={{ fontWeight: "bold" }}>القرار النهائي: {selectedInquest.decisionText || ""}</p>
                        <p>قائد المدرسة : أ/ عبد الله شاكر الغامدي</p>
                        <p>التوقيع: ......................... </p>
                        <p>التاريخ: {new Date(selectedInquest.createdAt).getFullYear()} / __ / __</p>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ marginTop: "20px", fontSize: "12px" }}>
                  <p style={{ fontWeight: "bold" }}>Important note:</p>
                  <p>The form is to be completed by the school principle and all decisions will be taken by him.</p>
                  <p style={{ direction: "rtl", fontWeight: "bold" }}>ملاحظة هامة</p>
                  <p style={{ direction: "rtl" }}>- يتم إستكمال بيانات المسائلة وإتخاذ كل القرارات من قِبل قائد المدرسة</p>
                </div>
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
                    </a>
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
              <p className="text-slate-600">Select an inquest</p>
              <p className="text-sm text-slate-500 mt-2">Choose from the list or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}