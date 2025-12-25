// src/components/UnreadAnnouncementModal.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { markAnnouncementAsRead } from "@/app/actions/announcements";

export async function UnreadAnnouncementModal() {
  const session = await getServerSession(authOptions);

  // Restrict access to teachers only
  if (!session?.user || session.user.role !== "TEACHER") {
    return null;
  }

  // Fetch the most recent unread announcement for the teacher
  const unreadRecipient = await prisma.announcementRecipient.findFirst({
    where: {
      teacherId: session.user.id,
      read: false,
    },
    orderBy: { announcement: { createdAt: "desc" } },
    include: { announcement: true },
  });

  // No unread announcements
  if (!unreadRecipient) {
    return null;
  }

  const announcement = unreadRecipient.announcement;

  const handleMarkAsRead = async () => {
    "use server";
    await markAnnouncementAsRead(unreadRecipient.id);
    revalidatePath("/dashboard/teacher");
  };

  const formattedDate = new Date(announcement.date).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="announcement-title"
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="border-b border-gray-200 px-8 py-6">
          <h2
            id="announcement-title"
            className="text-2xl font-semibold text-gray-900"
          >
            {announcement.title}
          </h2>
        </div>

        {/* Modal Body */}
        <div className="px-8 py-6">
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed mb-8">
            <p>{announcement.body}</p>
          </div>

          {announcement.attachmentUrl && (
            <a
              href={announcement.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-teal-700 hover:text-teal-800 font-medium transition-colors"
            >
              <span className="text-lg">📎</span>
              View Attachment
            </a>
          )}

          <p className="mt-6 text-sm text-gray-500">
            Posted on <time dateTime={announcement.date.toISOString()}>{formattedDate}</time>
          </p>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-8 py-6">
          <form action={handleMarkAsRead} className="w-full">
            <button
              type="submit"
              className="w-full rounded-xl bg-teal-600 px-6 py-3 text-lg font-medium text-white shadow-sm transition-all hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/50 disabled:opacity-70"
            >
              Mark as Read
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}