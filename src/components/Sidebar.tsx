"use client";

import { useState, useEffect } from "react";
import { Link, usePathname } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";

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
  close: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  menu: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
};

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const t = useTranslations("Sidebar");
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const isRTL = locale !== "en";

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isActive = (href: string, exact: boolean = false) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      <button
        onClick={toggleSidebar}
        className={`fixed top-4 z-50 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 shadow-lg shadow-teal-500/40 text-white transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-teal-300 md:hidden ${
          isRTL ? "left-4" : "right-4"
        }`}
        aria-label="Toggle Menu"
      >
        {isOpen ? icons.close : icons.menu}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 z-50 flex h-full w-72 flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out
          ${isRTL ? "right-0" : "left-0"}
          ${isOpen ? "translate-x-0" : (isRTL ? "translate-x-full" : "-translate-x-full")}
          md:relative md:translate-x-0 md:w-72 md:shadow-none md:border-r md:border-slate-100
        `}
      >
        <div className="flex h-20 items-center justify-center border-b border-slate-50 bg-gradient-to-r from-white to-slate-50/50 md:hidden">
          <span className="text-xl font-black tracking-tight text-slate-800">
            {role === "ADMIN" ? "Admin" : "Teacher"}
          </span>
        </div>

        <div className="flex h-full flex-col overflow-y-auto px-4 py-6">
          <nav className="space-y-1.5">
            {role === "ADMIN" && (
              <>
                <SidebarLink
                  href="/dashboard/admin"
                  icon={icons.overview}
                  active={isActive("/dashboard/admin", true)}
                  onClick={() => setIsOpen(false)}
                  locale={locale}
                >
                  {t("overview")}
                </SidebarLink>

                <SidebarLink
                  href="/dashboard/admin/inquests"
                  icon={icons.inquests}
                  active={isActive("/dashboard/admin/inquests")}
                  onClick={() => setIsOpen(false)}
                  locale={locale}
                >
                  {t("teachersInquests")}
                </SidebarLink>

                <SidebarLink
                  href="/dashboard/admin/teachers"
                  icon={icons.teachers}
                  active={isActive("/dashboard/admin/teachers")}
                  onClick={() => setIsOpen(false)}
                  locale={locale}
                >
                  {t("teachers")}
                </SidebarLink>

                <SidebarLink
                  href="/dashboard/admin/announcements"
                  icon={icons.announcements}
                  active={isActive("/dashboard/admin/announcements")}
                  onClick={() => setIsOpen(false)}
                  locale={locale}
                >
                  {t("announcements")}
                </SidebarLink>

                <SidebarLink
                  href="/dashboard/admin/daily-activities-admin"
                  icon={icons.lessons}
                  active={isActive("/dashboard/admin/daily-activities-admin")}
                  onClick={() => setIsOpen(false)}
                  locale={locale}
                >
                  {t("dailyLessonsManagement")}
                </SidebarLink>
                <SidebarLink
                  href="/dashboard/admin/teachers-weekly-evaluations"
                  icon={icons.lessons}
                  active={isActive("/dashboard/admin/teachers-weekly-evaluations")}
                  onClick={() => setIsOpen(false)}
                  locale={locale}
                >
                  {`${
                    locale === "en"
                      ? "Weekly Follow-up "
                      : "تقارير التقييم الاسبوعية"
                  }`}
                </SidebarLink>
              </>
            )}

            {role === "TEACHER" && (
              <>
                <SidebarLink
                  href="/dashboard/teacher"
                  icon={icons.overview}
                  active={isActive("/dashboard/teacher", true)}
                  onClick={() => setIsOpen(false)}
                  locale={locale}
                >
                  {t("overview")}
                </SidebarLink>

                <SidebarLink
                  href="/dashboard/teacher/inquests"
                  icon={icons.inquests}
                  active={isActive("/dashboard/teacher/inquests")}
                  onClick={() => setIsOpen(false)}
                  locale={locale}
                >
                  {t("myInquests")}
                </SidebarLink>

                <SidebarLink
                  href="/dashboard/teacher/announcements"
                  icon={icons.announcements}
                  active={isActive("/dashboard/teacher/announcements")}
                  onClick={() => setIsOpen(false)}
                  locale={locale}
                >
                  {t("announcements")}
                </SidebarLink>

                <SidebarLink
                  href="/dashboard/admin/daily-activities-teacher"
                  icon={icons.lessons}
                  active={isActive("/dashboard/admin/daily-activities-teacher")}
                  onClick={() => setIsOpen(false)}
                  locale={locale}
                >
                  {t("dailyLessonsManagement")}
                </SidebarLink>
                <SidebarLink
                  href="/dashboard/teacher/my-weekly-evaluations"
                  icon={icons.lessons}
                  active={isActive("/dashboard/teacher/my-weekly-evaluations")}
                  onClick={() => setIsOpen(false)}
                  locale={locale}
                >
                  {`${
                    locale === "en"
                      ? "Weekly Follow up"
                      : "تقارير التقييم الاسبوعية"
                  }`}
                </SidebarLink>
              </>
            )}

            <div className="pt-6">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-2 text-xs text-slate-400 font-medium tracking-wider uppercase">System</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
              <SidebarLink
                href="/dashboard/notifications"
                icon={icons.notifications}
                active={isActive("/dashboard/notifications")}
                onClick={() => setIsOpen(false)}
                locale={locale}
              >
                {t("notifications")}
              </SidebarLink>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}

function SidebarLink({
  href,
  icon,
  children,
  active,
  onClick,
  locale,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active: boolean;
  onClick?: () => void;
  locale: string;
}) {
  const isRTL = locale !== "en";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        group relative flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
        ${
          active
            ? "bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 shadow-sm ring-1 ring-teal-100"
            : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-900"
        }
      `}
    >
      <span
        className={`
          flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-300 shrink-0
          ${
            active
              ? "border-teal-100 bg-white text-teal-600 shadow-md shadow-teal-100"
              : "border-transparent bg-slate-100/50 text-slate-400 group-hover:bg-white group-hover:text-slate-600 group-hover:shadow-sm"
          }
        `}
      >
        {icon}
      </span>
      <span className={`truncate ${active ? "font-bold" : ""}`}>
        {children}
      </span>
      {active && (
        <div
          className={`absolute top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-teal-400 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] ${
            isRTL ? "left-0" : "right-0"
          }`}
        />
      )}
    </Link>
  );
}