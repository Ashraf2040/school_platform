"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

type Props = {
  currentType?: string;
  currentFrom?: string;
  currentTo?: string;
};

export default function AnnouncementsFilter({
  currentType,
  currentFrom,
  currentTo,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const updateSearchParams = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
        Filter Announcements
      </h3>

      <div className="grid md:grid-cols-4 gap-4">
        {/* TYPE */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Type
          </label>
          <select
            value={currentType || ""}
            onChange={(e) => updateSearchParams("type", e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Types</option>
            <option value="GENERAL">General</option>
            <option value="TARGETED">Targeted</option>
            <option value="DRAW_ATTENTION">Draw Attention</option>
          </select>
        </div>

        {/* FROM */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={currentFrom || ""}
            onChange={(e) => updateSearchParams("from", e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* TO */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={currentTo || ""}
            onChange={(e) => updateSearchParams("to", e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* CLEAR */}
        <div className="flex items-end">
          <button
            onClick={() => router.push(pathname)}
            className="w-full bg-slate-600 hover:bg-slate-700 text-white py-2.5 rounded-lg"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}
