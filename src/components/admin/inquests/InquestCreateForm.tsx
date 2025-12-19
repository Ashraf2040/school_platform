// components/admin/inquests/InquestCreateForm.tsx
import { AcademicYear, Teacher } from "./types";

type FormState = {
  inquestType: "ABSENT" | "NEGLIGENCE";
  reason: string;
  details: string;
  teacherJobTitle: string;
  teacherSpecialty: string;
  teacherSchool: string;
  clarificationRequest: string;
};

type Props = {
  form: FormState;
  setForm: (form: FormState) => void;
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

      <form onSubmit={onSubmit} className="space-y-5">
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
              setForm({ ...form, inquestType: e.target.value as "ABSENT" | "NEGLIGENCE" })
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
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Details (Optional)</label>
          <textarea
            value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dir-auto"
          />
        </div>

        <div className="grid grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
            <input
              type="text"
              value={form.teacherJobTitle}
              onChange={(e) => setForm({ ...form, teacherJobTitle: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Specialty</label>
            <input
              type="text"
              value={form.teacherSpecialty}
              onChange={(e) => setForm({ ...form, teacherSpecialty: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">School</label>
            <input
              type="text"
              value={form.teacherSchool}
              onChange={(e) => setForm({ ...form, teacherSchool: e.target.value })}
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
  );
}