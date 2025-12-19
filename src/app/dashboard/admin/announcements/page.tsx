// app/dashboard/admin/announcements/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminAnnouncementsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const announcements = await prisma.announcement.findMany({
    orderBy: { date: "desc" },
    take: 10,
  });

  return (
    <div className="mx-auto max-w-7xl py-10 px-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        Create New Announcement
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* General Announcement */}
        <Link
          href="/dashboard/admin/announcements/create?type=general"
          className="block p-8 rounded-2xl bg-white shadow-md border-2 border-dashed border-slate-300 hover:border-teal-500 hover:shadow-lg transition"
        >
          <div className="text-center">
            <span className="text-6xl mb-4 block">🌐</span>
            <h2 className="text-2xl font-bold text-slate-900">
              General Announcement
            </h2>
            <p className="mt-3 text-slate-600">
              Sent to <strong>all teachers</strong> in the school.
            </p>
          </div>
        </Link>

        {/* Targeted Announcement */}
        <Link
          href={{
            pathname: "/dashboard/admin/announcements/create",
            query: { type: "targeted" },
          }}
          className="block p-8 rounded-2xl bg-white shadow-md border-2 border-dashed border-slate-300 hover:border-teal-500 hover:shadow-lg transition"
        >
          <div className="text-center">
            <span className="text-6xl mb-4 block">🎯</span>
            <h2 className="text-2xl font-bold text-slate-900">
              Targeted Announcement
            </h2>
            <p className="mt-3 text-slate-600">
              Choose specific teachers or subjects.
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Recent Announcements
        </h2>

        {announcements.length === 0 ? (
          <p className="text-slate-500">No announcements yet.</p>
        ) : (
          <ul className="space-y-4">
            {announcements.map((a) => (
              <li
                key={a.id}
                className="p-4 rounded-lg border bg-white flex flex-col gap-1"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-slate-900">{a.title}</h3>
                  <span className="text-xs uppercase text-slate-500">
                    {a.type}
                  </span>
                </div>
                <p className="text-sm text-slate-700 line-clamp-2">{a.body}</p>
                <p className="text-xs text-slate-500">
                  {a.date.toDateString()}
                </p>
                {a.attachmentUrl && (
                  <a
                    href={a.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-teal-600 underline mt-1"
                  >
                    View attachment
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
