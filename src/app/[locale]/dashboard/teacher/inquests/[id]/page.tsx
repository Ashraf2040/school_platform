"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";

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
  drawAttentionText?: string;
  status: "PENDING" | "RESPONDED" | "COMPLETED";
  createdAt: string;
  academicYear: { name: string };
  createdBy: { name: string };
};

export default function TeacherInquestDetail() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [inquest, setInquest] = useState<Inquest | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({ teacherClarification: "" });
  const [file, setFile] = useState<File | null>(null);

  // =========================
  // Load Inquest
  // =========================
  useEffect(() => {
    const loadInquest = async () => {
      try {
        console.log("📡 Fetching inquest:", id);

        const res = await fetch(`/api/inquests/${id}`);
        console.log("📥 Inquest response status:", res.status);

        if (!res.ok) throw new Error("Failed to load inquest");

        const data = await res.json();
        console.log("✅ Inquest data:", data);

        setInquest(data);
        setForm({ teacherClarification: data.teacherClarification || "" });

        if (data.status === "PENDING") {
          setShowForm(true);
        }

        // Mark notification as read
        await fetch("/api/notifications/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inquestId: id }),
        });

        console.log("🔔 Notification marked as read");
      } catch (err) {
        console.error("❌ Load inquest error:", err);
        toast.error("Failed to load inquest");
        suggestRedirect();
      }
    };

    loadInquest();
  }, [id, router]);

  const suggestRedirect = () => {
    router.push("/dashboard/teacher/inquests");
  };

  // =========================
  // Submit Response
  // =========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquest) return;

    setPending(true);

    try {
      let attachmentUrl = inquest.attachmentUrl;

      // -------- Upload file --------
      if (file) {
        console.log("📤 Uploading file:", file.name, file.type, file.size);

        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        console.log("📥 Upload response status:", uploadRes.status);

        if (!uploadRes.ok) throw new Error("Failed to upload file");

        const uploadData = await uploadRes.json();
        console.log("✅ Uploaded file URL:", uploadData.url);

        attachmentUrl = uploadData.url;
      }

      // -------- Patch inquest --------
      console.log("📝 Submitting clarification with attachment:", attachmentUrl);

      const res = await fetch(`/api/inquests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherClarification: form.teacherClarification,
          attachmentUrl,
          status: "RESPONDED",
        }),
      });

      console.log("📥 Patch response status:", res.status);

      if (!res.ok) throw new Error("Failed to submit response");

      toast.success("Response submitted successfully");
      setShowForm(false);

      const updated = await fetch(`/api/inquests/${id}`).then((r) => r.json());
      console.log("🔄 Updated inquest:", updated);

      setInquest(updated);
    } catch (err: any) {
      console.error("❌ Submit error:", err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setPending(false);
    }
  };

  // =========================
  // Loading state
  // =========================
  if (!inquest) {
    return (
      <div className="mx-auto max-w-6xl py-10 px-6">
        <div className="text-center text-base text-slate-600">
          Loading inquest details...
        </div>
      </div>
    );
  }

  const opinionOptions = [
    { en: "Excuse accepted", ar: "عذر مقبول" },
    { en: "Alert", ar: "تنبيه" },
    { en: "Draw attention", ar: "لفت نظر" },
    { en: "Deduction for NOT accepting this excuse", ar: "حسم لعدم قبول العذر" },
  ];

  return (
    <div className="mx-auto max-w-6xl py-10 px-6 space-y-8 font-['Noto_Sans_Arabic',sans-serif]">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Inquest Details</h1>
        <p className="mt-2 text-sm text-slate-600">
          View the inquest and submit your response if required.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                    inquest.inquestType === "ABSENT"
                      ? "bg-orange-500/40"
                      : "bg-red-500/40"
                  }`}
                >
                  {inquest.inquestType === "ABSENT" ? "Absent Inquest" : "Negligence in Work"}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    inquest.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : inquest.status === "RESPONDED"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {inquest.status}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-white">{inquest.reason}</h2>
              <p className="mt-1 text-xs text-teal-100">
                Issued on{" "}
                {new Date(inquest.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Teacher Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
            <div>
              <span className="font-semibold text-slate-700">Academic Year:</span>
              <p className="mt-1 text-slate-900">{inquest.academicYear.name}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Issued By:</span>
              <p className="mt-1 text-slate-900">{inquest.createdBy.name}</p>
            </div>
            {inquest.teacherJobTitle && (
              <div>
                <span className="font-semibold text-slate-700">Job Title:</span>
                <p className="mt-1 text-slate-900" dir="auto">{inquest.teacherJobTitle}</p>
              </div>
            )}
            {inquest.teacherSpecialty && (
              <div>
                <span className="font-semibold text-slate-700">Specialty:</span>
                <p className="mt-1 text-slate-900" dir="auto">{inquest.teacherSpecialty}</p>
              </div>
            )}
            {inquest.teacherSchool && (
              <div>
                <span className="font-semibold text-slate-700">School:</span>
                <p className="mt-1 text-slate-900" dir="auto">{inquest.teacherSchool}</p>
              </div>
            )}
          </div>

          {/* Clarification Request */}
          {(inquest.reason || inquest.details || inquest.clarificationRequest) && (
            <section className="border-2 border-cyan-600 rounded-xl p-6 bg-cyan-50">
              <h3 className="text-lg font-bold text-cyan-900 mb-4 text-center">
                Clarification Request / طلب إيضاح
              </h3>
              <div className="space-y-3 text-sm">
                {inquest.reason && (
                  <div>
                    <strong>Reason / السبب:</strong>
                    <p className="mt-1 text-slate-800" dir="auto">{inquest.reason}</p>
                  </div>
                )}
                {inquest.details && (
                  <div>
                    <strong>Details / التفاصيل:</strong>
                    <p className="mt-1 text-slate-800" dir="auto">{inquest.details}</p>
                  </div>
                )}
                {inquest.clarificationRequest && (
                  <div>
                    <strong>Request / طلب التوضيح:</strong>
                    <p className="mt-1 text-slate-800" dir="auto">{inquest.clarificationRequest}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Teacher Response */}
          {inquest.teacherClarification && (
            <section className="border-2 border-emerald-600 rounded-xl p-6 bg-emerald-50">
              <h3 className="text-lg font-bold text-emerald-900 mb-4 text-center">
                Your Clarification / توضيحك
              </h3>
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <p className="text-sm text-slate-800 leading-relaxed" dir="auto">
                  {inquest.teacherClarification}
                </p>
              </div>
            </section>
          )}

          {/* Principal Opinion */}
          {inquest.principalOpinion && (
            <section className="border-2 border-amber-600 rounded-xl p-6 bg-amber-50">
              <h3 className="text-lg font-bold text-amber-900 mb-4 text-center">
                Principal's Opinion / رأي قائد المدرسة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {opinionOptions.map((opt) => (
                    <div key={opt.en} className="flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-amber-600 rounded flex items-center justify-center">
                        {inquest.principalOpinion?.includes(opt.en) && (
                          <div className="w-4 h-4 bg-amber-600 rounded"></div>
                        )}
                      </div>
                      <span className="text-sm font-medium">{opt.en}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 text-right" dir="rtl">
                  {opinionOptions.map((opt) => (
                    <div key={opt.ar} className="flex items-center gap-3 justify-end">
                      <span className="text-sm font-medium">{opt.ar}</span>
                      <div className="w-6 h-6 border-2 border-amber-600 rounded flex items-center justify-center">
                        {inquest.principalOpinion?.includes(opt.en) && (
                          <div className="w-4 h-4 bg-amber-600 rounded"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Draw Attention (لفت نظر) */}
          {inquest.drawAttentionText && (
            <section className="border-4 border-red-600 rounded-xl p-8 bg-red-50">
              <h3 className="text-2xl font-bold text-red-900 mb-6 text-center">
                لفت نظر - Draw Attention
              </h3>
              <div
                className="bg-white rounded-lg p-6 border-2 border-red-400 text-right whitespace-pre-line leading-relaxed text-lg"
                dir="rtl"
              >
                {inquest.drawAttentionText}
              </div>
            </section>
          )}

          {/* Final Decision */}
          {inquest.decisionText && (
            <section className="border-4 border-teal-600 rounded-xl p-8 bg-teal-50">
              <h3 className="text-2xl font-bold text-teal-900 mb-6 text-center">
                القرار النهائي / Final Decision
              </h3>
              <div className="bg-white rounded-lg p-6 border-2 border-teal-400 text-center">
                <p className="text-xl font-semibold text-teal-800 leading-relaxed" dir="auto">
                  {inquest.decisionText}
                </p>
              </div>
            </section>
          )}

          {/* Attachment */}
        {inquest.attachmentUrl && (
        <section className="border-t pt-6">
          <h3 className="text-base font-semibold text-slate-900 mb-3">
            Attachment
          </h3>

          <a
            href={inquest.attachmentUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              console.log("📄 Opening attachment URL:", inquest.attachmentUrl);
            }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700 hover:underline"
          >
            Download / View Uploaded PDF →
          </a>
        </section>
      )}

          {/* Response Form */}
          {showForm && inquest.status === "PENDING" && (
            <section className="border-t pt-8 mt-8 bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 text-center">
                Submit Your Response / قدم توضيحك
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-base font-semibold text-slate-800 mb-3">
                    Your Clarification / توضيحك
                  </label>
                  <textarea
                    value={form.teacherClarification}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, teacherClarification: e.target.value }))
                    }
                    required
                    rows={6}
                    className="w-full rounded-xl border-2 border-slate-300 px-5 py-4 text-base focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition"
                    placeholder="اكتب توضيحك بالتفصيل هنا..."
                    dir="auto"
                  />
                </div>

                <div>
                  <label className="block text-base font-semibold text-slate-800 mb-3">
                    Upload Supporting Document (PDF)
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-sm file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-teal-600 file:text-white hover:file:bg-teal-700 cursor-pointer"
                  />
                  <p className="mt-2 text-sm text-slate-600">
                    مثل: شهادة طبية، إجازة مرضية، إلخ.
                  </p>
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-8 py-3 text-base font-medium text-slate-700 hover:text-slate-900 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-xl bg-teal-600 px-10 py-3 text-base font-bold text-white shadow-lg hover:bg-teal-700 disabled:opacity-60 transition"
                  >
                    {pending ? "Submitting..." : "Submit Response"}
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}