"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/login");
      return;
    }

    const load = async () => {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        setNotifications(data);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [session, status, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl py-16 px-6 text-center">
        <p className="text-lg font-medium text-slate-700">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-8 px-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
        <p className="mt-2 text-base text-slate-600">
          Stay updated with inquests and important alerts.
        </p>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4 opacity-20">🔔</div>
            <p className="text-lg font-medium text-slate-700">No notifications yet</p>
            <p className="text-sm text-slate-500 mt-2">
              New inquests and alerts will appear here when available.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => n.link && router.push(n.link)}
                className={`w-full text-left px-6 py-5 hover:bg-teal-50/30 transition-all ${
                  !n.read ? "bg-teal-50/50" : ""
                } ${n.link ? "cursor-pointer" : "cursor-default"}`}
              >
                <div className="flex items-start gap-4">
                  {!n.read && (
                    <div className="h-3 w-3 rounded-full bg-teal-600 mt-1.5 flex-shrink-0"></div>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-base font-semibold text-slate-900">{n.title}</h3>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700 leading-relaxed">{n.body}</p>
                    {n.link && (
                      <span className="mt-3 inline-block text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline">
                        View details →
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}