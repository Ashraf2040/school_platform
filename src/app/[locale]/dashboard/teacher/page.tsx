// app/dashboard/teacher/page.tsx


import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UnreadAnnouncementModal } from "@/components/UnreadAnnouncementModal";



export default async function TeacherHome() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }
// Add this inside your Teacher Dashboard component or in a useEffec


  const cards = [
    {
      name: "Daily Lessons Management",
      href: "/dashboard/admin/daily-activities-teacher",
      description: "Submit and view your weekly teaching reports.",
      icon: "📊",
    },
    {
      name: "Weekly Follow-up Reports",
      href: "/dashboard/teacher/weekly-achievement",
      description: "Submit and view your weekly teaching reports.",
      icon: "📊",
    },
    {
      name: "My Inquests",
      href: "/dashboard/teacher/inquests",
      description: "View all inquests issued to you.",
      icon: "📋",
    },
    {
      name: "Notifications",
      href: "/dashboard/notifications",
      description: "Stay updated with important alerts.",
      icon: "🔔",
    },
    {
      name: "Announcements",
      href: "/dashboard/teacher/announcements",
      description: "View all school announcements.",
      icon: "📢",
    },
  ];

  return (
    <div className="min-h-screen text-slate-900 relative overflow-hidden bg-slate-50">
      
      {/* ================= BACKGROUND ================= */}
      {/* Matching the Homepage aesthetic for brand consistency */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/30 rounded-full blur-[100px] opacity-60" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.3]">
          <defs>
            <pattern id="teacher-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#0f766e" /> {/* Teal dots */}
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#teacher-grid)" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/90" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* ================= WELCOME HERO ================= */}
        <div className="mb-12 relative group">
          {/* Gradient Border Effect */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-teal-500 to-emerald-500 rounded-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 blur-sm" />
          
          <div className="relative flex flex-col sm:flex-row items-center sm:items-center gap-6 sm:gap-8 bg-white/90 backdrop-blur-md border border-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50">
            
            {/* Avatar / Icon */}
            <div className="flex-shrink-0">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-teal-500/30 ring-4 ring-white">
                {session.user.name ? session.user.name.charAt(0).toUpperCase() : "T"}
              </div>
            </div>

            {/* Text Content */}
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, <span className="text-teal-700">{session.user.name}</span>
              </h1>
              {/* <p className="mt-2 text-slate-500 text-lg max-w-2xl">
                You have access to your daily lessons, inquests, and reports. What would you like to do today?
              </p> */}
            </div>

            {/* Date/Time Badge (Optional nice touch) */}
            <div className="hidden sm:block text-right">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Session</p>
               <div className="px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-teal-700 font-semibold text-sm">
                 {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
               </div>
            </div>
          </div>
        </div>

        {/* ================= DASHBOARD GRID ================= */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.name}
              href={card.href}
              className="group relative flex flex-col h-full p-7 bg-white/60 backdrop-blur-lg border border-white/60 rounded-3xl shadow-sm shadow-slate-200/50 hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Hover Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              {/* Top Decorative Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-emerald-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

              <div className="relative z-10 flex flex-col h-full">
                {/* Icon Container */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="h-14 w-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md transition-all duration-300">
                    {card.icon}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                     <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-teal-700 transition-colors">
                    {card.name}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <UnreadAnnouncementModal />
    </div>
  );
}