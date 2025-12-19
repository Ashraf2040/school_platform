// components/admin/inquests/InquestsFilters.tsx
import { AcademicYear, Teacher } from "./types";

type Props = {
  years: AcademicYear[];
  teachers: Teacher[];
  filterYearId: string;
  filterTeacherId: string;
  filterMonth: string;
  filterStatus: string;
  getMonthOptions: { value: string; label: string }[];
  onFilterYearChange: (v: string) => void;
  onFilterTeacherChange: (v: string) => void;
  onFilterMonthChange: (v: string) => void;
  onFilterStatusChange: (v: string) => void;
  onCreateNew: () => void;
};

export function InquestsFilters({
  years,
  teachers,
  filterYearId,
  filterTeacherId,
  filterMonth,
  filterStatus,
  getMonthOptions,
  onFilterYearChange,
  onFilterTeacherChange,
  onFilterMonthChange,
  onFilterStatusChange,
  onCreateNew,
}: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
      <div className="grid gap-5 md:grid-cols-5">
        {/* Academic Year */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Academic Year</label>
          <select
            value={filterYearId}
            onChange={(e) => onFilterYearChange(e.target.value)}
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

        {/* Month */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
          <select
            value={filterMonth}
            onChange={(e) => onFilterMonthChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
          >
            <option value="">All Months</option>
            {getMonthOptions.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Teacher */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Teacher</label>
          <select
            value={filterTeacherId}
            onChange={(e) => onFilterTeacherChange(e.target.value)}
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

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="RESPONDED">RESPONDED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>

        {/* Create Button */}
        <div className="flex items-end">
          <button
            onClick={onCreateNew}
            className="w-full rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-teal-600 transition"
          >
            Create New Inquest
          </button>
        </div>
      </div>
    </div>
  );
}