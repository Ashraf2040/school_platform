// app/dashboard/teacher/announcements/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function TeacherAnnouncementsListPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  // All announcements that have this teacher as recipient
  const recipients = await prisma.announcementRecipient.findMany({
    where: { teacherId: session.user.id },
    include: { announcement: true },
    orderBy: { announcement: { date: "desc" } },
  });

  const announcements = recipients.map((r) => r.announcement);

  return (
    <div className="mx-auto max-w-4xl py-10 px-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">
        Announcements
      </h1>
      <p className="text-slate-600 mb-8">
        All announcements shared with you.
      </p>

      {announcements.length === 0 ? (
        <p className="text-slate-500">No announcements yet.</p>
      ) : (
        <ul className="space-y-4">
          {announcements.map((ann) => (
            <li
              key={ann.id}
              className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition"
            >
              <Link
                href={`/dashboard/teacher/announcements/${ann.id}`}
                className="block"
              >
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-semibold text-slate-900">{ann.title}</h2>
                  <span className="text-xs uppercase text-slate-500">
                    {ann.type}
                  </span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">
                  {ann.body}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {new Date(ann.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
