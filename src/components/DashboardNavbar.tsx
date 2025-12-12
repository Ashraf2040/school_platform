// src/components/DashboardNavbar.tsx
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ProfileDropdown } from "./ProfileDropdown";


const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

export async function DashboardNavbar() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const unreadCount = await getUnreadCount(session.user.id);
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
          {/* Notification Bell */}
          <Link
            href="/dashboard/notifications"
            className="relative inline-flex items-center justify-center h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Notifications"
          >
            <span className="text-lg">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full bg-red-500 text-[10px] text-white font-bold flex items-center justify-center shadow">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

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
