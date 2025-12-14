// src/components/DashboardNavbar.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma"; // ← Adjust path if needed
import { ProfileDropdown } from "./ProfileDropdown";
import { NotificationDropdown } from "./NotificationDropdown";

async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

async function getRecentNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      title: true,
      body: true,
      link: true,
      read: true,
      createdAt: true,
      inquestId: true,
    },
  });
}

export async function DashboardNavbar() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const unreadCount = await getUnreadCount(session.user.id);
  const recentNotifications = await getRecentNotifications(session.user.id);

  const role = session.user.role;

  const initials = session.user.name
    ?.split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Logo + Title */}
        <Link
          href={role === "ADMIN" ? "/dashboard/admin" : "/dashboard/teacher"}
          className="flex items-center gap-3 group"
        >
          <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center text-lg font-bold shadow group-hover:bg-teal-700 transition">
            SM
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition">
              School Manager
            </p>
            <p className="text-[11px] text-slate-600">
              {role === "ADMIN" ? "Admin Dashboard" : "Teacher Dashboard"}
            </p>
          </div>
        </Link>

        {/* Middle: Quick links */}
        <nav className="hidden md:flex items-center gap-4 text-sm">
          <Link
            href={
              role === "ADMIN"
                ? "/dashboard/admin/inquests"
                : "/dashboard/teacher/inquests"
            }
            className="px-3 py-1.5 rounded-full text-slate-700 hover:text-teal-700 hover:bg-teal-50 transition"
          >
            Inquests
          </Link>
          {role === "ADMIN" && (
            <Link
              href="/dashboard/admin/teachers"
              className="px-3 py-1.5 rounded-full text-slate-700 hover:text-teal-700 hover:bg-teal-50 transition"
            >
              Teachers
            </Link>
          )}
          <Link
            href="/dashboard/notifications"
            className="px-3 py-1.5 rounded-full text-slate-700 hover:text-teal-700 hover:bg-teal-50 transition"
          >
            Notifications
          </Link>
        </nav>

        {/* Right: Notifications + Profile */}
        <div className="flex items-center gap-3">
          <NotificationDropdown
            unreadCount={unreadCount}
            recentNotifications={recentNotifications}
          />

          <ProfileDropdown
            name={session.user.name || "User"}
            email={session.user.email || ""}
            role={role}
            initials={initials || "U"}
          />
        </div>
      </div>
    </header>
  );
}