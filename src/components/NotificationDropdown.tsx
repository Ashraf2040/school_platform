// src/components/NotificationDropdown.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { markNotificationsAsRead } from "@/app/actions/markNotificationsRead";

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

export function NotificationDropdown({
  unreadCount: initialUnreadCount,
  recentNotifications,
}: Props) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifications, setNotifications] = useState(recentNotifications);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* 🔁 Sync unread count with server props */
  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  /* 🔁 Sync notifications list if server sends new ones */
  useEffect(() => {
    setNotifications(recentNotifications);
  }, [recentNotifications]);

  /* 📌 Unread notification IDs */
  const unreadIds = notifications.filter(n => !n.read).map(n => n.id);

  /* ✅ Mark as read when dropdown opens */
  useEffect(() => {
    if (!open || unreadIds.length === 0) return;

    startTransition(async () => {
      await markNotificationsAsRead(unreadIds);

      // Update local state immediately
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );

      setUnreadCount(0);
    });
  }, [open]);

  /* ❌ Close on outside click */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleSeeAll = () => {
    setOpen(false);
    router.push("/dashboard/notifications");
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* 🔔 Bell Button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <span className="text-xl">🔔</span>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-red-500 text-[10px] text-white font-bold flex items-center justify-center shadow-lg">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* 📬 Dropdown */}
      {open && (
        <div className="absolute right-0 mt-3 w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden z-50">
          <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b">
            <h3 className="text-lg font-bold">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-sm font-semibold text-teal-600">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-500">
                No notifications yet
              </div>
            ) : (
              notifications.map(notif => (
                <button
                  key={notif.id}
                  onClick={handleSeeAll}
                  className={`w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-slate-50 ${
                    !notif.read ? "bg-teal-50/40" : ""
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                    🔔
                  </div>

                  <div className="flex-1">
                    <p className={`text-sm ${!notif.read ? "font-bold" : ""}`}>
                      {notif.title}
                    </p>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {notif.body}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatTime(new Date(notif.createdAt))}
                    </p>
                  </div>

                  {!notif.read && (
                    <span className="mt-2 h-2 w-2 rounded-full bg-teal-600" />
                  )}
                </button>
              ))
            )}
          </div>

          <div className="px-5 py-3 bg-slate-50 border-t">
            <button
              onClick={handleSeeAll}
              className="w-full text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              See all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
