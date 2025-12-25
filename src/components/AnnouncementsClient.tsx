"use client";

import { useEffect, useState, useTransition } from "react";
import AnnouncementsTable from "@/components/AnnouncementsTable";
import { getFilteredAnnouncements } from "@/app/[locale]/dashboard/admin/announcements/actions";

export default function AnnouncementsClient({ locale }: { locale: string }) {
  const [filters, setFilters] = useState<any>({ page: 1 });
  const [data, setData] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  const load = (next: any) => {
    startTransition(async () => {
      const res = await getFilteredAnnouncements(next);
      setData(res);
      setFilters(next);
    });
  };

  useEffect(() => {
    load({ page: 1 });
  }, []);

  return (
    <div>
      {/* FILTERS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <select onChange={(e) => load({ ...filters, type: e.target.value || undefined })}>
          <option value="">All</option>
          <option value="GENERAL">General</option>
          <option value="TARGETED">Targeted</option>
          <option value="DRAW_ATTENTION">Draw Attention</option>
        </select>

        <input type="date" onChange={(e) => load({ ...filters, from: e.target.value })} />
        <input type="date" onChange={(e) => load({ ...filters, to: e.target.value })} />

        <button onClick={() => load({ page: 1 })}>Clear</button>
      </div>

      {/* LOADING */}
      {isPending && <p className="text-center">Loading...</p>}

      {/* TABLE */}
      {data && (
        <>
          <AnnouncementsTable announcements={data.items} locale={locale} />

          {/* PAGINATION */}
          <div className="flex gap-2 mt-4">
            {Array.from({ length: data.pages }).map((_, i) => (
              <button
                key={i}
                onClick={() => load({ ...filters, page: i + 1 })}
                className="px-3 py-1 border rounded"
              >
                {i + 1}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
