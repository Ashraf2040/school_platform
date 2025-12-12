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
  const [form, setForm] = useState({
    teacherClarification: "",
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const loadInquest = async () => {
      try {
        const res = await fetch(`/api/inquests/${id}`);
        if (!res.ok) throw new Error("Failed to load inquest");
        const data = await res.json();
        setInquest(data);
        setForm({
          teacherClarification: data.teacherClarification || "",
        });
        if (data.status === "PENDING") setShowForm(true);
      } catch {
        toast.error("Failed to load inquest");
        router.push("/dashboard/teacher/inquests");
      }
    };
    loadInquest();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquest) return;

    setPending(true);
    try {
      let attachmentUrl = inquest.attachmentUrl;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) throw new Error("Failed to upload file");
        const uploadData = await uploadRes.json();
        attachmentUrl = uploadData.url;
      }

      const res = await fetch(`/api/inquests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherClarification: form.teacherClarification,
          attachmentUrl,
          status: "RESPONDED",
        }),
      });
      if (!res.ok) throw new Error("Failed to submit response");
      toast.success("Response submitted successfully");
      setShowForm(false);
      const updated = await fetch(`/api/inquests/${id}`).then((r) => r.json());
      setInquest(updated);
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setPending(false);
    }
  };

  if (!inquest) {
    return (
      <div className="mx-auto max-w-5xl py-16 px-6">
        <div className="text-center text-xl text-slate-600">Loading inquest details...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-12 px-6 space-y-10 font-['Noto_Sans_Arabic',sans-serif]">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900">Inquest Details</h1>
        <p className="mt-3 text-xl text-slate-700">View the inquest and submit your response if required.</p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-10 py-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-4">
                <span
                  className={`px-6 py-3 rounded-full text-lg font-bold text-white ${
                    inquest.inquestType === "ABSENT" ? "bg-orange-500/30" : "bg-red-500/30"
                  }`}
                >
                  {inquest.inquestType === "ABSENT" ? "Absent Inquest" : "Negligence in Work"}
                </span>
                <span
                  className={`px-6 py-3 rounded-full text-lg font-bold ${
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
              <h2 className="mt-6 text-3xl font-extrabold text-white">{inquest.reason}</h2>
              <p className="mt-3 text-lg text-teal-100">
                Issued on{" "}
                {new Date(inquest.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-10">
          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-lg">
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

          {/* Section: Details & Requests */}
          {inquest.details && (
            <div className="border-t pt-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Details / Follow-up</h3>
              <p className="text-lg text-slate-700 leading-relaxed" dir="auto">{inquest.details}</p>
            </div>
          )}

          {inquest.clarificationRequest && (
            <div className="border-t pt-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Clarification Requested</h3>
              <p className="text-lg text-slate-700 leading-relaxed" dir="auto">{inquest.clarificationRequest}</p>
            </div>
          )}

          {inquest.teacherClarification && (
            <div className="border-t pt-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Your Submitted Clarification</h3>
              <p className="text-lg text-slate-700 leading-relaxed" dir="auto">{inquest.teacherClarification}</p>
            </div>
          )}

          {inquest.attachmentUrl && (
            <div className="border-t pt-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Attachment</h3>
              <a
                href={inquest.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xl font-semibold text-teal-600 hover:text-teal-700 hover:underline transition"
              >
                View Uploaded PDF →
              </a>
            </div>
          )}

          {inquest.principalOpinion && (
            <div className="border-t pt-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Principal's Opinion</h3>
              <p className="text-lg text-slate-700 leading-relaxed" dir="auto">{inquest.principalOpinion}</p>
            </div>
          )}

          {inquest.decisionText && (
            <div className="border-t pt-8 bg-teal-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Final Decision</h3>
              <p className="text-xl font-semibold text-teal-800 leading-relaxed" dir="auto">{inquest.decisionText}</p>
            </div>
          )}

          {/* Response Form */}
          {showForm && inquest.status === "PENDING" && (
            <div className="border-t pt-10 mt-10">
              <h3 className="text-2xl font-bold text-slate-900 mb-8">Submit Your Response</h3>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label className="block text-lg font-semibold text-slate-800 mb-3">
                    Your Clarification / Response
                  </label>
                  <textarea
                    value={form.teacherClarification}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, teacherClarification: e.target.value }))
                    }
                    required
                    rows={6}
                    className="w-full rounded-2xl border-2 border-slate-300 px-6 py-4 text-base focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition"
                    placeholder="Provide a detailed explanation or clarification..."
                    dir="auto"
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold text-slate-800 mb-3">
                    Upload Supporting Document (PDF)
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-700 cursor-pointer"
                  />
                  <p className="mt-2 text-sm text-slate-600">e.g., medical certificate, sick leave, etc.</p>
                </div>

                <div className="flex justify-end gap-5">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-8 py-4 text-lg font-semibold text-slate-700 hover:text-slate-900 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-xl bg-teal-600 px-10 py-4 text-lg font-bold text-white shadow-xl hover:bg-teal-700 hover:shadow-2xl disabled:opacity-60 transition"
                  >
                    {pending ? "Submitting..." : "Submit Response"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}