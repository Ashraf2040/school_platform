// src/components/DashboardNavbar.tsx
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function getUnreadCount(userId: string) {
  return await prisma.notification.count({
    where: { userId, read: false },
  });
}

export async function DashboardNavbar() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const unreadCount = await getUnreadCount(session.user.id);
  const role = session.user.role;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-6">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center text-xl font-bold shadow">
            SM
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">School Manager</h1>
            <p className="text-xs text-slate-600">
              {role === "ADMIN" ? "Admin Dashboard" : "Teacher Dashboard"}
            </p>
          </div>
        </div>

        {/* Middle: Description - only on large screens */}
        <div className="hidden md:block text-sm text-slate-600 text-center max-w-sm">
          {role === "ADMIN"
            ? "Manage teachers, inquests, classes, and notifications."
            : "View your inquests, notifications, and daily tasks."}
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <Link
            href="/dashboard/notifications"
            className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
            title="Notifications"
          >
            <span className="text-xl">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{session.user.name}</p>
              <p className="text-xs text-slate-600">
                {role === "ADMIN" ? "Administrator" : "Teacher"}
              </p>
            </div>

            {/* Avatar */}
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold shadow">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>

            {/* Sign Out */}
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  );
}