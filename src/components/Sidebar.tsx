// src/app/dashboard/Sidebar.tsx
"use client";

import { Link, usePathname } from "@/navigation";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { useState } from "react";

// Simple inline SVG icons (unchanged)
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
  const t = useTranslations("Sidebar");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const closeMenu = () => setMobileMenuOpen(false);

  const navContent = (
    <>
      {role === "ADMIN" && (
        <>
          <SidebarLink href="/dashboard/admin" icon={icons.overview} active={isActive("/dashboard/admin")} onClick={closeMenu}>
            {t("overview")}
          </SidebarLink>

          <SidebarLink href="/dashboard/admin/inquests" icon={icons.inquests} active={isActive("/dashboard/admin/inquests")} onClick={closeMenu}>
            {t("teachersInquests")}
          </SidebarLink>

          <SidebarLink href="/dashboard/admin/teachers" icon={icons.teachers} active={isActive("/dashboard/admin/teachers")} onClick={closeMenu}>
            {t("teachers")}
          </SidebarLink>

          <SidebarLink href="/dashboard/admin/announcements" icon={icons.announcements} active={isActive("/dashboard/admin/announcements")} onClick={closeMenu}>
            {t("announcements")}
          </SidebarLink>

          <SidebarLink
            href="/dashboard/admin/daily-activities-admin"
            icon={icons.lessons}
            active={isActive("/dashboard/admin/daily-activities-admin")}
            onClick={closeMenu}
          >
            {t("dailyLessonsManagement")}
          </SidebarLink>
        </>
      )}

      {role === "TEACHER" && (
        <>
          <SidebarLink href="/dashboard/teacher" icon={icons.overview} active={isActive("/dashboard/teacher")} onClick={closeMenu}>
            {t("overview")}
          </SidebarLink>

          <SidebarLink href="/dashboard/teacher/inquests" icon={icons.inquests} active={isActive("/dashboard/teacher/inquests")} onClick={closeMenu}>
            {t("myInquests")}
          </SidebarLink>

          <SidebarLink href="/dashboard/teacher/announcements" icon={icons.announcements} active={isActive("/dashboard/teacher/announcements")} onClick={closeMenu}>
            {t("announcements")}
          </SidebarLink>

          <SidebarLink
            href="/dashboard/teacher/daily-activities-teacher"  
            icon={icons.lessons}
            active={isActive("/dashboard/teacher/daily-activities-teacher")}
            onClick={closeMenu}
          >
            {t("dailyLessonsManagement")}
          </SidebarLink>
        </>
      )}

      <div className="pt-6">
        <div className="h-px bg-slate-200 mb-3" />
        <SidebarLink href="/dashboard/notifications" icon={icons.notifications} active={isActive("/dashboard/notifications")} onClick={closeMenu}>
          {t("notifications")}
        </SidebarLink>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white lg:shadow-sm">
        <nav className="flex-1 px-4 py-6 space-y-1">{navContent}</nav>
      </aside>

      {/* Mobile Header + Burger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/dashboard" className="text-xl font-semibold text-teal-700">
            Dashboard
          </Link>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={closeMenu}
          />

          {/* Panel */}
          <div className="relative flex flex-col w-80 max-w-full bg-white shadow-xl animate-in slide-in-from-left">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Menu</h2>
              <button
                onClick={closeMenu}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
              {navContent}
            </nav>
          </div>
        </div>
      )}

      {/* Add top padding on mobile so content isn't hidden under fixed header */}
      <div className="lg:hidden h-16" />
    </>
  );
}

// Updated SidebarLink to accept optional onClick (for mobile closing)
function SidebarLink({
  href,
  icon,
  children,
  active,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
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