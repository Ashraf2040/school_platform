// app/admin/inquests/page.tsx or wherever it lives
"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

import { InquestsFilters } from "@/components/admin/inquests/InquestsFilters";
import { InquestsTable } from "@/components/admin/inquests/InquestsTable";
import { InquestCreateForm } from "@/components/admin/inquests/InquestCreateForm";
import { InquestDecisionForm } from "@/components/admin/inquests/InquestDecisionForm";
import { InquestDetailsView } from "@/components/admin/inquests/InquestDetailsView";
import { InquestPDFPreview } from "@/components/admin/inquests/InquestPDFPreview";

import { Teacher, AcademicYear, Inquest } from "@/components/admin/inquests/types";

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
    drawAttentionText: "",
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
console.log(form)
  // --- Decision Form Pre-fill (Kept intact) ---
  useEffect(() => {
  if (selectedInquest && selectedInquest.status === "RESPONDED") {
    setDecisionForm({
      principalOpinion: selectedInquest.principalOpinion || "",
      decisionText: selectedInquest.decisionText || "",
      drawAttentionText: selectedInquest.drawAttentionText || "", // add this
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
    const payload: any = {
      principalOpinion: decisionForm.principalOpinion,
      decisionText: decisionForm.decisionText,
      status: "COMPLETED",
    };

    // 1. تحديث التحقيق (Inquest)
    // Only add drawAttentionText if "Draw attention" is selected
    if (decisionForm.principalOpinion?.includes("Draw attention")) {
      payload.drawAttentionText = decisionForm.drawAttentionText;
    }

    const res = await fetch(`/api/inquests/${selectedInquest.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to update inquest");
    }

    // 2. إذا تم اختيار "Draw attention" → إنشاء إعلان مستهدف عبر API Route
    if (decisionForm.principalOpinion?.includes("Draw attention") && decisionForm.drawAttentionText) {
      // 🔴 التأكد من إرسال البيانات الصحيحة إلى API Route
      const announcementRes = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "لفت نظر - Draw Attention", // العنوان المطلوب
          body: decisionForm.drawAttentionText, // نص لفت النظر
          type: "DRAW_ATTENTION", // النوع لتمييزه
          teacherIds: [selectedInquest.teacher.id], // المعلم المستهدف
        }),
      });

      if (!announcementRes.ok) {
        console.warn("Failed to send draw attention announcement");
        // لا نوقف العملية في حال فشل الإشعار
      }
    }

    toast.success("Decision saved and inquest completed");
    setShowDecisionForm(false);

    // Refresh list
    const updated = await fetch(`/api/admin/inquests`).then((r) => r.json());
    setAllInquests(updated);
    const updatedInquest = updated.find((i: Inquest) => i.id === selectedInquest.id);
    setSelectedInquest(updatedInquest);
  } catch (e: any) {
    toast.error(e.message || "Failed to save decision");
  } finally {
    setPending(false);
  }
}

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

  return (
    <div className="mx-auto w-full py-8 px-6 space-y-8 font-['Noto_Sans_Arabic',sans-serif]">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Teachers Inquests</h1>
        <p className="mt-2 text-base text-slate-600">
          Create, review, and manage teacher inquests efficiently.
        </p>
      </div>

      <InquestsFilters
        years={years}
        teachers={teachers}
        filterYearId={filterYearId}
        filterTeacherId={filterTeacherId}
        filterMonth={filterMonth}
        filterStatus={filterStatus}
        getMonthOptions={getMonthOptions}
        onFilterYearChange={setFilterYearId}
        onFilterTeacherChange={setFilterTeacherId}
        onFilterMonthChange={setFilterMonth}
        onFilterStatusChange={setFilterStatus}
        onCreateNew={() => {
          setShowForm(true);
          setSelectedInquest(null);
          setShowDecisionForm(false);
          setShowPDFPreview(false);
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
        <InquestsTable
          inquests={inquests}
          selectedInquest={selectedInquest}
          onSelectInquest={(i) => {
            setSelectedInquest(i);
            setShowForm(false);
            setShowDecisionForm(false);
            setShowPDFPreview(false);
          }}
          onAddDecision={(i) => {
            setSelectedInquest(i);
            setShowDecisionForm(true);
          }}
          onPreview={(i) => {
            setSelectedInquest(i);
            handlePreview();
          }}
        />
      </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-md border border-slate-200">
            {showForm ? (
              <InquestCreateForm
                form={form}
                setForm={setForm}
                filterYearId={filterYearId}
                setFilterYearId={setFilterYearId}
                filterTeacherId={filterTeacherId}
                setFilterTeacherId={setFilterTeacherId}
                years={years}
                teachers={teachers}
                pending={pending}
                onSubmit={handleCreateSubmit}
                onCancel={() => setShowForm(false)}
              />
            ) : showDecisionForm && selectedInquest ? (
              <InquestDecisionForm
                decisionForm={decisionForm}
                setDecisionForm={setDecisionForm}
                pending={pending}
                onSubmit={handleDecisionSubmit}
                onCancel={() => setShowDecisionForm(false)}
              />
            ) : showPDFPreview && selectedInquest ? (
              <InquestPDFPreview
                inquest={selectedInquest}
                generatingPDF={generatingPDF}
                onClose={() => setShowPDFPreview(false)}
                onDownload={generatePDF}
              />
            ) : selectedInquest ? (
              <InquestDetailsView
                inquest={selectedInquest}
                onAddDecision={() => setShowDecisionForm(true)}
                onPreview={handlePreview}
              />
            ) : (
              <div className="p-12 text-center">
                <div className="text-5xl mb-4 opacity-20">📋</div>
                <p className="text-slate-600">Select an inquest from the table above to view details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}