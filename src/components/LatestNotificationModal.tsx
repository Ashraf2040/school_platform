// src/components/LatestNotificationModal.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";

type Notification = {
  id: string;
  title: string;
  body: string;
  link?: string | null;
};

export function LatestNotificationModal() {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchLatest() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (data.latest) {
          setNotification(data.latest);
          setOpen(true);
        }
      } catch (err) {
        console.error("Failed to load latest notification:", err);
        // Silent – no unread notifications or error
      }
    }
    fetchLatest();
  }, []);

  const markAsRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/notifications", { method: "POST" });
      toast.success("All notifications marked as read");
      setOpen(false);
    } catch {
      toast.error("Failed to mark as read");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !notification) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {notification.title}
          </h3>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-6 whitespace-pre-wrap">
          {notification.body}
        </p>

        <div className="flex gap-3 justify-end">
          {notification.link && (
            <Link
              href={notification.link}
              className="px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 border border-teal-600 rounded-lg"
            >
              View Details
            </Link>
          )}
          <button
            onClick={markAsRead}
            disabled={loading}
            className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-60"
          >
            {loading ? "Marking..." : "Mark as Read"}
          </button>
        </div>
      </div>
    </div>
  );
}