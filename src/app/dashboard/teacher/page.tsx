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

  return (
    <div className="mx-auto max-w-5xl py-16 px-6">
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900">
          Welcome back, {session.user.name}!
        </h1>
        <p className="mt-4 text-xl text-slate-700">Here's an overview of your account.</p>
      </div>

      <div className="mt-12 grid gap-12 md:grid-cols-2">
        <Link
          href="/dashboard/teacher/inquests"
          className="rounded-3xl bg-white p-12 shadow-2xl border border-slate-200 hover:shadow-3xl hover:border-teal-500 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900">My Inquests</h3>
              <p className="mt-6 text-xl text-slate-700">View all inquests issued to you</p>
            </div>
            <span className="text-7xl">📋</span>
          </div>
        </Link>

        <Link
          href="/dashboard/notifications"
          className="rounded-3xl bg-white p-12 shadow-2xl border border-slate-200 hover:shadow-3xl hover:border-teal-500 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-extrabold text-slate-900">Notifications</h3>
              <p className="mt-6 text-xl text-slate-700">Stay updated with important alerts</p>
            </div>
            <span className="text-7xl">🔔</span>
          </div>
        </Link>
      </div>

      <LatestNotificationModal />
    </div>
  );
}