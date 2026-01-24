'use client';

import { Link } from "@/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { ProfileDropdown } from "./ProfileDropdown";
import { NotificationDropdown } from "./NotificationDropdown";
import LanguageSwitcher from "./LanguageSwitcher";
import type { ClientNotification } from "@/types/notification";

type Notification = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
  inquestId: string | null;
};

export default function DashboardNavbar() {
  const { data: session, status } = useSession();
  const t = useTranslations("DashboardNavbar");

  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<ClientNotification[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const loadNotifications = async () => {
      const [countRes, listRes] = await Promise.all([
        fetch("/api/notifications/unread-count"),
        fetch("/api/notifications/recent"),
      ]);

      const { count } = await countRes.json();
      const { notifications } = await listRes.json();

      const parsedNotifications: ClientNotification[] = notifications.map(
        (n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        })
      );

      setUnreadCount(count);
      setRecentNotifications(parsedNotifications);
    };

    loadNotifications();
  }, [session?.user?.id]);

  if (status === "loading" || !session?.user) return null;

  const role = session.user.role;

  const initials =
    session.user.name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <header className=" top-0 z-30 w-full border-b border-slate-200/60 bg-white/90 backdrop-blur-md shadow-sm shadow-slate-100/50">
      {/* Gradient Accent Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-teal-500 to-emerald-600" />
      
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
          {/* Branding */}
          <Link
            href={role === "ADMIN" ? "/dashboard/admin" : "/dashboard/teacher"}
            className="flex items-center gap-3 group"
          >
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center text-lg sm:text-xl font-bold shadow-md shadow-teal-500/30 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
              SM
            </div>
            <div className="leading-tight hidden sm:block">
              <p className="text-sm sm:text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                {t("appName")}
              </p>
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wide">
                {role === "ADMIN" ? t("adminDashboard") : t("teacherDashboard")}
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href={
                role === "ADMIN"
                  ? "/dashboard/admin/inquests"
                  : "/dashboard/teacher/inquests"
              }
              className="px-4 py-2 rounded-full text-sm font-medium text-slate-600 transition-all duration-200 hover:text-teal-700 hover:bg-teal-50/80"
            >
              {t("inquests")}
            </Link>

            {role === "ADMIN" && (
              <Link
                href="/dashboard/admin/teachers"
                className="px-4 py-2 rounded-full text-sm font-medium text-slate-600 transition-all duration-200 hover:text-teal-700 hover:bg-teal-50/80"
              >
                {t("teachers")}
              </Link>
            )}

            <Link
              href="/dashboard/notifications"
              className="px-4 py-2 rounded-full text-sm font-medium text-slate-600 transition-all duration-200 hover:text-teal-700 hover:bg-teal-50/80"
            >
              {t("notifications")}
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationDropdown
              unreadCount={unreadCount}
              recentNotifications={recentNotifications}
            />
            <ProfileDropdown
              name={session.user.name || t("user")}
              email={session.user.email || ""}
              role={role}
              initials={initials}
            />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
