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

  const cards = [
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
    {
      name: "Weekly Achievement",
      href: "/dashboard/teacher/weekly-achievement",
      description: "Submit and view your weekly teaching reports.",
      icon: "📊",
    },
  ];

  return (
    <div className="min-h-screen bg-grid-slate-100/40 bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
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
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
            <span className="leading-tight">
              Welcome back, {session.user.name}
            </span>
          </h1>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <Link
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
                    Open
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
            </Link>
          ))}
        </div>
      </div>

      <UnreadAnnouncementModal />
    </div>
  );
}