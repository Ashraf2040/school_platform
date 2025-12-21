// src/app/dashboard/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Simple inline SVG icons (no external dependency)
const icons = {
  overview: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  inquests: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  teachers: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  announcements: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-2.999-9.168-3H7a4.001 4.001 0 01-1.564-.317z" />
    </svg>
  ),
  lessons: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  notifications: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
};

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="w-64 border-r border-slate-200 bg-white shadow-sm">
      <div className="flex h-full flex-col">
        {/* Sidebar Header */}
        {/* <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-600 text-white flex items-center justify-center text-xl font-bold">
              SM
            </div>
            <div>
              <p className="font-semibold text-slate-800">School Manager</p>
              <p className="text-xs text-slate-500">Al Forqan School</p>
            </div>
          </div>
        </div> */}

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {role === "ADMIN" && (
            <>
              <SidebarLink href="/dashboard/admin" icon={icons.overview} active={isActive("/dashboard/admin")}>
                Overview
              </SidebarLink>
              <SidebarLink href="/dashboard/admin/inquests" icon={icons.inquests} active={isActive("/dashboard/admin/inquests")}>
                Teachers Inquests
              </SidebarLink>
              <SidebarLink href="/dashboard/admin/teachers" icon={icons.teachers} active={isActive("/dashboard/admin/teachers")}>
                Teachers
              </SidebarLink>
              <SidebarLink href="/dashboard/admin/announcements" icon={icons.announcements} active={isActive("/dashboard/admin/announcements")}>
                Announcements
              </SidebarLink>
              <SidebarLink href="/dashboard/admin/daily-activities-admin" icon={icons.lessons} active={isActive("/dashboard/admin/daily-activities-admin")}>
                Daily Lessons Management
              </SidebarLink>
            </>
          )}

          {role === "TEACHER" && (
            <>
              <SidebarLink href="/dashboard/teacher" icon={icons.overview} active={isActive("/dashboard/teacher")}>
                Overview
              </SidebarLink>
              <SidebarLink href="/dashboard/teacher/inquests" icon={icons.inquests} active={isActive("/dashboard/teacher/inquests")}>
                My Inquests
              </SidebarLink>
              <SidebarLink href="/dashboard/teacher/announcements" icon={icons.announcements} active={isActive("/dashboard/teacher/announcements")}>
                Announcements
              </SidebarLink>
              <SidebarLink href="/dashboard/admin/daily-activities-teacher" icon={icons.lessons} active={isActive("/dashboard/admin/daily-activities-teacher")}>
                Daily Lessons Management
              </SidebarLink>
            </>
          )}

          {/* Common section */}
          <div className="pt-6">
            <div className="h-px bg-slate-200 mb-3" />
            <SidebarLink href="/dashboard/notifications" icon={icons.notifications} active={isActive("/dashboard/notifications")}>
              Notifications
            </SidebarLink>
          </div>
        </nav>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  icon,
  children,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
        ${active
          ? "bg-teal-50 text-teal-700 shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }
      `}
    >
      <span className={active ? "text-teal-600" : "text-slate-500 group-hover:text-slate-700"}>
        {icon}
      </span>
      <span>{children}</span>
      {active && <div className="ml-auto h-8 w-1 rounded-full bg-teal-600" />}
    </Link>
  );
}