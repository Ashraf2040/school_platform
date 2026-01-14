
// app/dashboard/teacher/page.tsx
import { LatestNotificationModal } from "@/components/LatestNotificationModal";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
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
    <div className="min-h-screen bg-slate-50/50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full">
        {/* Header Section */}
       


<div className="mb-8 sm:mb-12 text-center sm:text-left flex flex-col items-center">
  <h1 className="inline-flex flex-col self-start sm:flex-row items-center gap-4 sm:gap-6 px-5 py-3 sm:px-8 sm:py-3 rounded-3xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 text-slate-900 text-2xl sm:text-4xl font-extrabold tracking-tight shadow-sm ring-1 ring-teal-100/50 w-full sm:w-auto justify-center sm:justify-start">
    <span className="flex h-10 w-10 sm:h-16 sm:w-16 items-center justify-center shrink-0 rounded-2xl bg-white border border-teal-100 text-teal-600 shadow-sm transition-transform duration-300 hover:rotate-6">
      <svg className="w-5 h-5 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </span>
    <span className="leading-tight text-center sm:text-left break-words">
      Welcome back, {session.user.name}
    </span>
  </h1>
 
</div>


        {/* Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
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
                    Open module
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
            </Link>
          ))}
        </div>
      </div>

      {/* Modals remain outside the max-width container if they are fixed overlays */}
      <UnreadAnnouncementModal />
    </div>
  );
}
