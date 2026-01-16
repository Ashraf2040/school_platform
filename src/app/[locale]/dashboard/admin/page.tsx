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
    <div className="min-h-screen bg-grid-slate-100/40 bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header - same style as teacher dashboard */}
        <div className="mb-10 sm:mb-14 text-center sm:text-left">
          <h1 className="inline-flex items-center gap-4 sm:gap-5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100/70 text-slate-800 text-2xl sm:text-3xl font-extrabold tracking-tight shadow-sm">
            <span className="flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-xl bg-white border border-teal-100 text-teal-600 shadow-sm transition-transform hover:rotate-6">
              <svg
                className="w-6 h-6 sm:w-7 sm:h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </span>
            <span className="leading-tight">
              {t("adminDashboardTitle")}
            </span>
          </h1>

          {/* Optional subtitle - uncomment if you want to keep it */}
          {/* <p className="mt-3 text-base sm:text-lg text-slate-500 max-w-2xl">
            {t("adminDashboardSubtitle")}
          </p> */}
        </div>

        {/* Cards Grid - same compact style as teacher version */}
        <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <a
              key={card.name}
              href={card.href}
              className="group relative flex flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-md shadow-slate-200/40 border border-slate-200/70 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-teal-700/10 hover:border-teal-200/70"
            >
              {/* Subtle hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50/30 to-emerald-50/10 opacity-0 transition-opacity duration-400 group-hover:opacity-100 pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full">
                {/* Icon */}
                <div className="mb-5 inline-flex self-start rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 p-1 shadow-md shadow-teal-600/20 transition-all duration-300 group-hover:scale-105 group-hover:rotate-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-2xl shadow-inner">
                    {card.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-teal-700 transition-colors duration-300">
                    {card.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                    {card.description}
                  </p>
                </div>

                {/* Footer action */}
                <div className="mt-5 flex items-center text-sm font-medium text-teal-600 group-hover:text-teal-700 transition-colors">
                  <span className="relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-teal-600 after:transition-all after:duration-300 group-hover:after:w-full">
                    {t("openModule")}
                  </span>
                  <svg
                    className="ml-2 h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
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