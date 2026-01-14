
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
    {
      name: "Teachers Weekly Evaluation",
      href: "/dashboard/admin/teachers-weekly-evaluations",
      description: "View and evaluate teachers' weekly reports.",
      icon: "📈",
    },
  ];

  return (
    // Changed background to a subtle slate tone to make white cards pop
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Section: Enhanced Typography */}
        <div className="mb-12 text-center sm:text-left sm:flex sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              {t("adminDashboardTitle")}
            </h1>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl leading-relaxed">
              {t("adminDashboardSubtitle")}
            </p>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <a
              key={card.name}
              href={card.href}
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-teal-900/10 border border-slate-100 hover:border-teal-100"
            >
              {/* Decorative background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative flex h-full flex-col">
                {/* Icon Section: Gradient background with glow */}
                <div className="mb-6 inline-flex self-start rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 p-1 shadow-lg shadow-teal-500/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-3xl">
                    {card.icon}
                  </div>
                </div>

                {/* Text Content */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {card.name}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500">
                    {card.description}
                  </p>
                </div>

                {/* Action Link: Slide animation */}
                <div className="mt-8 flex items-center text-sm font-semibold text-teal-600 group-hover:text-teal-700">
                  <span className="relative">
                    {t("openModule")}
                    <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-teal-600 transition-all duration-300 group-hover:w-full"></span>
                  </span>
                  <svg
                    className="ml-2 h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
