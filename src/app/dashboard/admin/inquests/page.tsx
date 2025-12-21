// app/admin/inquests/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

import { InquestsFilters } from "@/components/admin/inquests/InquestsFilters";
import { InquestsTable } from "@/components/admin/inquests/InquestsTable";
import { InquestCreateForm, FormState } from "@/components/admin/inquests/InquestCreateForm"; // Import FormState
import { InquestDecisionForm } from "@/components/admin/inquests/InquestDecisionForm";
import { InquestDetailsView } from "@/components/admin/inquests/InquestDetailsView";
import { InquestPDFPreview } from "@/components/admin/inquests/InquestPDFPreview";

import { Teacher, AcademicYear, Inquest } from "@/components/admin/inquests/types";

// Initial form state
const initialFormState: FormState = {
  inquestType: "ABSENT",
  reason: "",
  details: "",
  teacherJobTitle: "",
  teacherSpecialty: "",
  teacherSchool: "",
  clarificationRequest: "",
  absenceDate: undefined, // ← Important: undefined, not ""
};

export default function AdminInquestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  
  // Filters
  const [filterYearId, setFilterYearId] = useState<string>("");
  const [filterTeacherId, setFilterTeacherId] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  
  const [allInquests, setAllInquests] = useState<Inquest[]>([]);
  const [inquests, setInquests] = useState<Inquest[]>([]);
  const [selectedInquest, setSelectedInquest] = useState<Inquest | null>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  
  const [pending, setPending] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Form state - now properly typed
  const [form, setForm] = useState<FormState>(initialFormState);

  const [decisionForm, setDecisionForm] = useState({
    principalOpinion: "",
    decisionText: "",
    drawAttentionText: "",
  });

  // Auth check
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/login");
    } else if (session.user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  // Load teachers and academic years
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
        if (current) setFilterYearId(current.id);
      } catch {
        toast.error("Failed to load initial data");
      }
    };
    load();
  }, []);

  // Load all inquests
  useEffect(() => {
    const loadInquests = async () => {
      try {
        const res = await fetch("/api/admin/inquests");
        if (!res.ok) throw new Error("Failed to fetch inquests");
        const data = await res.json();
        setAllInquests(data);
      } catch (e: any) {
        toast.error(e.message || "Failed to load inquests");
      }
    };
    loadInquests();
  }, []);

  // Apply filters locally
  useEffect(() => {
    let filtered = [...allInquests];

    if (filterYearId) {
      filtered = filtered.filter((i) => i.academicYear.id === filterYearId);
    }
    if (filterTeacherId) {
      filtered = filtered.filter((i) => i.teacher.id === filterTeacherId);
    }
    if (filterMonth) {
      filtered = filtered.filter((i) => {
        const date = new Date(i.createdAt);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        return month === filterMonth;
      });
    }
    if (filterStatus) {
      filtered = filtered.filter((i) => i.status === filterStatus);
    }

    setInquests(filtered);
    setSelectedInquest(null); // Clear selection when filters change
  }, [allInquests, filterYearId, filterTeacherId, filterMonth, filterStatus]);

  // Pre-fill decision form when inquest is responded
  useEffect(() => {
    if (selectedInquest && selectedInquest.status === "RESPONDED") {
      setDecisionForm({
        principalOpinion: selectedInquest.principalOpinion || "",
        decisionText: selectedInquest.decisionText || "",
        drawAttentionText: selectedInquest.drawAttentionText || "",
      });
    }
  }, [selectedInquest]);

  // Handle Create Inquest
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterTeacherId || !filterYearId) {
      toast.error("Please select academic year and teacher");
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
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to create inquest");
      }

      toast.success("Inquest created and notification sent!");

      // Reset form
      setForm(initialFormState);

      // Close form
      setShowForm(false);

      // Refresh inquest list
      const updated = await fetch("/api/admin/inquests").then((r) => r.json());
      setAllInquests(updated);
    } catch (err: any) {
      toast.error(err.message || "Failed to create inquest");
    } finally {
      setPending(false);
    }
  };

  // Handle Decision Submit
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

      // Send draw attention announcement if needed
      if (decisionForm.principalOpinion?.includes("Draw attention") && decisionForm.drawAttentionText) {
        await fetch("/api/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "لفت نظر - Draw Attention",
            body: decisionForm.drawAttentionText,
            type: "DRAW_ATTENTION",
            teacherIds: [selectedInquest.teacher.id],
          }),
        });
      }

      toast.success("Decision saved and inquest completed");
      setShowDecisionForm(false);

      // Refresh data
      const updated = await fetch("/api/admin/inquests").then((r) => r.json());
      setAllInquests(updated);
      const updatedInquest = updated.find((i: Inquest) => i.id === selectedInquest.id);
      setSelectedInquest(updatedInquest || null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save decision");
    } finally {
      setPending(false);
    }
  };

  const handlePreview = () => setShowPDFPreview(true);

  const generatePDF = async () => {
    if (!selectedInquest || generatingPDF) return;
    setGeneratingPDF(true);
    const loadingId = toast.loading("Generating PDF...");

    try {
      await new Promise((r) => setTimeout(r, 300));
      const el = document.getElementById("pdf-preview-template");
      if (!el) throw new Error("Preview template not found");

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save(`Inquest_${selectedInquest.teacher.name.replace(/\s+/g, "_")}_${new Date(selectedInquest.createdAt).toLocaleDateString("en-GB")}.pdf`);

      toast.dismiss(loadingId);
      toast.success("PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.dismiss(loadingId);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  const getMonthOptions = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleString("en-US", { year: "numeric", month: "long" });
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

        <div className="lg:col-span-3">
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
                <p className="text-slate-600">Select an inquest from the table to view details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}