"use client";

import { useTranslations } from "next-intl";

export default function AdminHome() {
  const t = useTranslations("AdminHome");

  // Helper component for icons to keep code clean
  const Icon = ({ path, className }: { path: string; className: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );

  const cards = [
    {
      name: t("teachersInquestsName"),
      href: "/dashboard/admin/inquests",
      description: t("teachersInquestsDescription"),
      iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
      colorClass: "text-blue-600",
      bgClass: "bg-blue-50 group-hover:bg-blue-100",
      borderClass: "group-hover:border-blue-400",
    },
    {
      name: t("teachersName"),
      href: "/dashboard/admin/teachers",
      description: t("teachersDescription"),
      iconPath: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      colorClass: "text-teal-600",
      bgClass: "bg-teal-50 group-hover:bg-teal-100",
      borderClass: "group-hover:border-teal-400",
    },
    {
      name: t("announcementsName"),
      href: "/dashboard/admin/announcements",
      description: t("announcementsDescription"),
      iconPath: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
      colorClass: "text-purple-600",
      bgClass: "bg-purple-50 group-hover:bg-purple-100",
      borderClass: "group-hover:border-purple-400",
    },
    {
      name: "Teachers Weekly Evaluation",
      href: "/dashboard/admin/teachers-weekly-evaluations",
      description: "View and evaluate teachers' weekly reports.",
      iconPath: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      colorClass: "text-orange-600",
      bgClass: "bg-orange-50 group-hover:bg-orange-100",
      borderClass: "group-hover:border-orange-400",
    },
  ];

  return (
    <div className="min-h-screen w-full text-slate-900 relative overflow-hidden bg-slate-50">
      
      {/* ================= BACKGROUND ================= */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Subtle top gradient */}
        <div className="absolute top-[-10%] left-0 w-full h-[600px] bg-gradient-to-b from-teal-50/30 to-transparent opacity-80" />
        
        {/* Fine Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.25]">
          <defs>
            <pattern id="admin-grid-fine" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#cbd5e1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#admin-grid-fine)" />
        </svg>
        
        {/* Bottom fade for smooth scrolling */}
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent pointer-events-none" />
      </div>

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div className="w-full px-6 lg:px-10 py-8 lg:py-10 flex flex-col gap-8">
        
        {/* ================= TOP HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Admin <span className="text-teal-600">Dashboard</span>
            </h1>
            <p className="mt-1 text-slate-500 text-base font-medium">
              Manage school operations and view reports.
            </p>
          </div>
          
          {/* Status Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 shadow-sm">
             <span className="relative flex h-2.5 w-2.5">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
             </span>
             <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">System Active</span>
          </div>
        </div>

        {/* ================= CARDS GRID ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((card) => (
            <a
              key={card.name}
              href={card.href}
              className={`group relative flex flex-col justify-between h-40 p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${card.borderClass}`}
            >
              {/* Top Colored Border (reveals on hover) */}
              <div className={`absolute top-0 left-4 right-4 h-0.5 bg-current opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${card.colorClass} bg-gradient-to-r`} />

              <div className="flex items-start justify-between">
                {/* Icon Container */}
                <div className={`h-10 w-10 rounded-lg ${card.bgClass} flex items-center justify-center transition-colors duration-300`}>
                   <Icon path={card.iconPath} className={`w-5 h-5 ${card.colorClass}`} />
                </div>
                
                {/* Arrow Icon (Reveals on hover) */}
                <div className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                   <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </div>
              </div>

              {/* Content */}
              <div className="mt-4">
                <h3 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-teal-700 transition-colors">
                  {card.name}
                </h3>
                <p className="mt-1.5 text-sm text-slate-500 line-clamp-2 leading-snug">
                  {card.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}