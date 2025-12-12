// app/dashboard/teacher/page.tsx
import { LatestNotificationModal } from "@/components/LatestNotificationModal";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

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
  ];

  return (
    <div className="mx-auto max-w-6xl py-10 px-6">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {session.user.name}
        </h1>
        <p className="mt-3 text-base text-slate-600">
          Select a module to manage your daily tasks.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.name}
            href={card.href}
            className="group block rounded-2xl bg-white p-6 shadow-md border border-slate-200 hover:shadow-lg hover:border-teal-400 transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-2xl group-hover:bg-teal-200 transition">
                {card.icon}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900">
                  {card.name}
                </h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center text-sm font-medium text-teal-600 group-hover:text-teal-700">
              <span>Open module</span>
              <span className="ml-2 transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>
        ))}
      </div>

      <LatestNotificationModal />
    </div>
  );
}
