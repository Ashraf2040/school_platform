"use client";

import { useTranslations } from "next-intl";

export default function AdminHome() {
  const t = useTranslations("AdminHome");

  const cards = [
    {
      name: t("teachersInquestsName"),
      href: "/dashboard/admin/inquests",
      description: t("teachersInquestsDescription"),
      icon: "📋",
    },
    {
      name: t("teachersName"),
      href: "/dashboard/admin/teachers",
      description: t("teachersDescription"),
      icon: "🧑‍🏫",
    },
    {
      name: t("announcementsName"),
      href: "/dashboard/admin/announcements",
      description: t("announcementsDescription"),
      icon: "📢",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl py-10 px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900">{t("adminDashboardTitle")}</h1>
        <p className="mt-3 text-base text-slate-600">{t("adminDashboardSubtitle")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <a
            key={card.name}
            href={card.href}
            className="group block rounded-2xl bg-white p-6 shadow-md border border-slate-200 hover:shadow-lg hover:border-teal-400 transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-2xl group-hover:bg-teal-200 transition">
                {card.icon}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-slate-900">{card.name}</h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{card.description}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center text-sm font-medium text-teal-600 group-hover:text-teal-700">
              <span>{t("openModule")}</span>
              <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
