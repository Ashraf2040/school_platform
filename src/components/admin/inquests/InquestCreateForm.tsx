// components/admin/inquests/InquestCreateForm.tsx
import { useEffect } from "react";
import { AcademicYear, Teacher } from "./types";

export type FormState = {
  inquestType: "ABSENT" | "NEGLIGENCE";
  reason: string;
  details: string;
  teacherJobTitle: string;
  teacherSpecialty: string;
  teacherSchool: string;
  clarificationRequest: string;
  absenceDate?: string; // Optional: YYYY-MM-DD
};

type Props = {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>; // ← FIXED HERE
  filterYearId: string;
  setFilterYearId: (id: string) => void;
  filterTeacherId: string;
  setFilterTeacherId: (id: string) => void;
  years: AcademicYear[];
  teachers: Teacher[];
  pending: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
};

export function InquestCreateForm({
  form,
  setForm,
  filterYearId,
  setFilterYearId,
  filterTeacherId,
  setFilterTeacherId,
  years,
  teachers,
  pending,
  onSubmit,
  onCancel,
}: Props) {
  // Auto-fill teacher profile fields when teacher changes
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
  }, [filterTeacherId, teachers, setForm]);

  // Auto-fill Reason when absenceDate changes and type is ABSENT
  useEffect(() => {
    if (form.inquestType === "ABSENT" && form.absenceDate) {
      const date = new Date(form.absenceDate);
      const formatted = date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      setForm((prev) => ({
        ...prev,
        reason: `Clarify the reason of absence on **${formatted}**`,
      }));
    }
  }, [form.inquestType, form.absenceDate, setForm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900">Create New Inquest</h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Academic Year & Teacher */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Academic Year <span className="text-red-500">*</span>
            </label>
            <select
              value={filterYearId}
              onChange={(e) => setFilterYearId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
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
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Teacher <span className="text-red-500">*</span>
            </label>
            <select
              value={filterTeacherId}
              onChange={(e) => setFilterTeacherId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
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

        {/* Inquest Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Inquest Type <span className="text-red-500">*</span>
          </label>
          <select
            value={form.inquestType}
            onChange={(e) =>
              setForm({ ...form, inquestType: e.target.value as "ABSENT" | "NEGLIGENCE" })
            }
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
          >
            <option value="ABSENT">Absence</option>
            <option value="NEGLIGENCE">Negligence</option>
          </select>
        </div>

        {/* Conditional Absence Date */}
        {form.inquestType === "ABSENT" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date of Absence <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.absenceDate ?? ""}
              onChange={(e) =>
                setForm({ ...form, absenceDate: e.target.value })
              }
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
            />
          </div>
        )}

        {/* Reason - auto-filled & read-only for Absence */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Reason <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            required
            readOnly={form.inquestType === "ABSENT" && !!form.absenceDate}
            className={`w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition ${
              form.inquestType === "ABSENT" && !!form.absenceDate ? "bg-slate-50 cursor-not-allowed" : ""
            }`}
          />
          {form.inquestType === "ABSENT" && !!form.absenceDate && (
            <p className="mt-1 text-xs text-slate-500">
              Auto-filled based on selected date (editable if needed)
            </p>
          )}
        </div>

        {/* Details (Optional) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Details (Optional)</label>
          <textarea
            value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition resize-none"
          />
        </div>

        {/* Teacher Info - Auto-filled, editable */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-3">Teacher Information (auto-filled)</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
              <input
                type="text"
                value={form.teacherJobTitle}
                onChange={(e) => setForm({ ...form, teacherJobTitle: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Specialty</label>
              <input
                type="text"
                value={form.teacherSpecialty}
                onChange={(e) => setForm({ ...form, teacherSpecialty: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">School</label>
              <input
                type="text"
                value={form.teacherSchool}
                onChange={(e) => setForm({ ...form, teacherSchool: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-teal-600 px-8 py-3 text-sm font-medium text-white shadow hover:bg-teal-700 disabled:opacity-60 transition"
          >
            {pending ? "Saving..." : "Create Inquest"}
          </button>
        </div>
      </form>
    </div>
  );
}