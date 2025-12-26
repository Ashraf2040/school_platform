// app/admin/inquests/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

import { InquestsFilters } from "@/components/admin/inquests/InquestsFilters";
import { InquestsTable } from "@/components/admin/inquests/InquestsTable";
import { InquestCreateForm, FormState } from "@/components/admin/inquests/InquestCreateForm";
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
  absenceDate: undefined,
};

export default function AdminInquestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("AdminInquests");

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);

  const [filterYearId, setFilterYearId] = useState("");
  const [filterTeacherId, setFilterTeacherId] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [allInquests, setAllInquests] = useState<Inquest[]>([]);
  const [inquests, setInquests] = useState<Inquest[]>([]);
  const [selectedInquest, setSelectedInquest] = useState<Inquest | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  const [pending, setPending] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const [form, setForm] = useState<FormState>(initialFormState);

  const [decisionForm, setDecisionForm] = useState({
    principalOpinion: "",
    decisionText: "",
    drawAttentionText: "",
  });
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
  /* ---------------- Auth ---------------- */
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) router.push("/login");
    else if (session.user.role !== "ADMIN") router.push("/dashboard");
  }, [session, status, router]);

  /* ---------------- Load data ---------------- */
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
        toast.error(t("errors.loadInitial"));
      }
    };
    load();
  }, [t]);

  useEffect(() => {
    const loadInquests = async () => {
      try {
        const res = await fetch("/api/admin/inquests");
        if (!res.ok) throw new Error();
        setAllInquests(await res.json());
      } catch {
        toast.error(t("errors.loadInquests"));
      }
    };
    loadInquests();
  }, [t]);

  /* ---------------- Filters ---------------- */
  useEffect(() => {
    let filtered = [...allInquests];

    if (filterYearId)
      filtered = filtered.filter((i) => i.academicYear.id === filterYearId);
    if (filterTeacherId)
      filtered = filtered.filter((i) => i.teacher.id === filterTeacherId);
    if (filterMonth)
      filtered = filtered.filter((i) => {
        const d = new Date(i.createdAt);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return m === filterMonth;
      });
    if (filterStatus)
      filtered = filtered.filter((i) => i.status === filterStatus);

    setInquests(filtered);
    setSelectedInquest(null);
  }, [allInquests, filterYearId, filterTeacherId, filterMonth, filterStatus]);
const handlePreview = () => setShowPDFPreview(true);
  /* ---------------- Create Inquest ---------------- */
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!filterTeacherId || !filterYearId) {
      toast.error(t("errors.selectYearTeacher"));
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

      if (!res.ok) throw new Error();

      toast.success(t("success.created"));
      setForm(initialFormState);
      setShowForm(false);

      setAllInquests(await fetch("/api/admin/inquests").then((r) => r.json()));
    } catch {
      toast.error(t("errors.create"));
    } finally {
      setPending(false);
    }
  };

  /* ---------------- PDF ---------------- */
  const generatePDF = async () => {
    if (!selectedInquest || generatingPDF) return;
    setGeneratingPDF(true);

    const loadingId = toast.loading(t("pdf.generating"));

    try {
      const el = document.getElementById("pdf-preview-template");
      if (!el) throw new Error();

      const canvas = await html2canvas(el, { scale: 2 });
      const img = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;

      pdf.addImage(img, "PNG", 0, 0, w, h);
      pdf.save(`Inquest_${selectedInquest.teacher.name}.pdf`);

      toast.dismiss(loadingId);
      toast.success(t("pdf.downloaded"));
    } catch {
      toast.error(t("pdf.failed"));
    } finally {
      setGeneratingPDF(false);
    }
  };

  const getMonthOptions = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleString("en-US", { month: "long", year: "numeric" }),
      });
    }
    return months;
  }, []);

  return (
    <div className="mx-auto w-full py-8 px-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-slate-600">{t("subtitle")}</p>
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
        onCreateNew={() => setShowForm(true)}
      />

      <div className="grid grid-cols-1 lg:block gap-8">
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