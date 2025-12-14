// src/components/NotificationDropdown.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { markNotificationsAsRead } from "@/app/actions/markNotificationsRead"; // adjust path

type Notification = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: Date;
  inquestId: string | null;
};

type Props = {
  unreadCount: number;
  recentNotifications: Notification[];
};

export function NotificationDropdown({ unreadCount: initialUnreadCount, recentNotifications }: Props) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extract unread notification IDs
  const unreadIds = recentNotifications
    .filter((n) => !n.read)
    .map((n) => n.id);

  // When dropdown opens → mark unread ones as read
  useEffect(() => {
    if (open && unreadIds.length > 0) {
      startTransition(async () => {
        await markNotificationsAsRead(unreadIds);
        setUnreadCount((prev) => Math.max(0, prev - unreadIds.length));
      });
    }
  }, [open, unreadIds.length]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSeeAll = () => {
    setOpen(false);
    router.push("/dashboard/notifications");
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors duration-200"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-red-500 text-[10px] text-white font-bold flex items-center justify-center shadow-lg">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-3 w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-50">
          <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-sm font-semibold text-teal-600">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="py-10 text-center text-slate-500">
                No notifications yet
              </div>
            ) : (
              recentNotifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={handleSeeAll}
                  className={`w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors ${
                    !notif.read ? "bg-teal-50/40" : "bg-white"
                  }`}
                >
                  <div className="mt-1 h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🔔</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-slate-900 truncate ${!notif.read ? "font-bold" : ""}`}>
                      {notif.title}
                    </p>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                      {notif.body}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      {formatTime(new Date(notif.createdAt))}
                    </p>
                  </div>

                  {!notif.read && (
                    <div className="mt-2 h-2 w-2 rounded-full bg-teal-600 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200">
            <button
              onClick={handleSeeAll}
              className="w-full text-center text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              See all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}