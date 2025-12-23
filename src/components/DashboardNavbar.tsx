// src/components/DashboardNavbar.tsx
"use client";

import Link from "next/link";
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
  const [recentNotifications, setRecentNotifications] =
  useState<ClientNotification[]>([]);

 useEffect(() => {
  if (!session?.user?.id) return;

  const loadNotifications = async () => {
    const [countRes, listRes] = await Promise.all([
      fetch("/api/notifications/unread-count"),
      fetch("/api/notifications/recent"),
    ]);

    const { count } = await countRes.json();
    const { notifications } = await listRes.json();

    // 👇 THIS IS WHERE IT GOES
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
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left */}
        <Link
          href={role === "ADMIN" ? "/dashboard/admin" : "/dashboard/teacher"}
          className="flex items-center gap-3 group"
        >
          <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center text-lg font-bold">
            SM
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-900">
              {t("appName")}
            </p>
            <p className="text-[11px] text-slate-600">
              {role === "ADMIN"
                ? t("adminDashboard")
                : t("teacherDashboard")}
            </p>
          </div>
        </Link>

        {/* Middle */}
        <nav className="hidden md:flex items-center gap-2">
          <Link
            href={
              role === "ADMIN"
                ? "/dashboard/admin/inquests"
                : "/dashboard/teacher/inquests"
            }
            className="px-4 py-2 rounded-full text-sm font-medium hover:bg-teal-50"
          >
            {t("inquests")}
          </Link>

          {role === "ADMIN" && (
            <Link
              href="/dashboard/admin/teachers"
              className="px-4 py-2 rounded-full text-sm font-medium hover:bg-teal-50"
            >
              {t("teachers")}
            </Link>
          )}

          <Link
            href="/dashboard/notifications"
            className="px-4 py-2 rounded-full text-sm font-medium hover:bg-teal-50"
          >
            {t("notifications")}
          </Link>
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
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
    </header>
  );
}
