// app/[locale]/dashboard/admin/announcements/AdminAnnouncementsClient.tsx
"use client";

import {useTranslations} from "next-intl";
import Link from "next/link";


type Announcement = {
  id: string;
  title: string;
  body: string;
  type: string;
  date: string | Date;
  attachmentUrl: string | null;
};

export default function AdminAnnouncementsClient({
  announcements
}: {
  announcements: Announcement[];
}) {
  const t = useTranslations("DashboardAdminAnnouncements");

  return (
    <div className="mx-auto w-4/5 py-10 px-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        {t("title")}
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* General Announcement */}
        <Link
          href={{href: "/dashboard/admin/announcements/create?type=general"}}
          className="block p-8 rounded-2xl bg-white shadow-md border-2 border-dashed border-slate-300 hover:border-teal-500 hover:shadow-lg transition"
        >
          <div className="text-center">
            <span className="text-6xl mb-4 block">🌐</span>
            <h2 className="text-2xl font-bold text-slate-900">
              {t("general.title")}
            </h2>
            <p className="mt-3 text-slate-600">
              {t("general.description")}
            </p>
          </div>
        </Link>

        {/* Targeted Announcement */}
        <Link
          href={{
            href: "/dashboard/admin/announcements/create",
            query: {type: "targeted"}
          }}
          className="block p-8 rounded-2xl bg-white shadow-md border-2 border-dashed border-slate-300 hover:border-teal-500 hover:shadow-lg transition"
        >
          <div className="text-center">
            <span className="text-6xl mb-4 block">🎯</span>
            <h2 className="text-2xl font-bold text-slate-900">
              {t("targeted.title")}
            </h2>
            <p className="mt-3 text-slate-600">
              {t("targeted.description")}
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          {t("recent.title")}
        </h2>

        {announcements.length === 0 ? (
          <p className="text-slate-500">{t("recent.empty")}</p>
        ) : (
          <ul className="space-y-4">
            {announcements.map((a) => (
              <li
                key={a.id}
                className="p-4 rounded-lg border bg-white flex flex-col gap-1"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-slate-900">{a.title}</h3>
                  <span className="text-xs uppercase text-slate-500">
                    {a.type}
                  </span>
                </div>
                <p className="text-sm text-slate-700 line-clamp-2">
                  {a.body}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(a.date).toDateString()}
                </p>
                {a.attachmentUrl && (
                  <a
                    href={a.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-teal-600 underline mt-1"
                  >
                    {t("recent.viewAttachment")}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
