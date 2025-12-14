// src/components/UnreadAnnouncementModal.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { markAnnouncementAsRead } from "@/app/actions/announcements";

export async function UnreadAnnouncementModal() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") return null;

  const unread = await prisma.announcementRecipient.findFirst({
    where: {
      teacherId: session.user.id,
      read: false,
    },
    orderBy: { announcement: { createdAt: "desc" } },
    include: { announcement: true },
  });

  if (!unread) return null;

  const ann = unread.announcement;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="max-w-2xl w-full mx-4 p-8 bg-white rounded-2xl shadow-2xl">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{ann.title}</h2>
        <p className="text-slate-600 mb-6 leading-relaxed">{ann.body}</p>

        {ann.attachmentUrl && (
          <a
            href={ann.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mb-6 text-teal-600 hover:underline font-medium"
          >
            📎 View Attachment
          </a>
        )}

        <p className="text-sm text-slate-500 mb-8">
          Posted on{" "}
          {new Date(ann.date).toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <form
          action={async () => {
            "use server";
            await markAnnouncementAsRead(unread.id);
            revalidatePath("/dashboard/teacher");
          }}
          className="mt-4"
        >
          <button
            type="submit"
            className="w-full btn btn-primary bg-teal-600 hover:bg-teal-700 border-none text-white font-bold py-3 rounded-xl"
          >
            Mark as Read
          </button>
        </form>
      </div>
    </div>
  );
}
