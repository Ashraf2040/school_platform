// app/[locale]/dashboard/admin/announcements/[id]/page.tsx

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FileText, ExternalLink, CheckCircle2, XCircle } from "lucide-react"; // Optional icons

export const dynamic = "force-dynamic";

export default async function AnnouncementDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) {
    redirect("/dashboard/admin/announcements");
  }

  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      recipients: {
        include: {
          teacher: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!announcement) {
    redirect("/dashboard/admin/announcements");
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "GENERAL":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "TARGETED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "DRAW_ATTENTION":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="mx-auto w-4/5 py-10 px-6 max-w-7xl">
      {/* Back Link */}
      <Link
        href="/dashboard/admin/announcements"
        className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium mb-6 transition"
      >
        ← Back to Announcements
      </Link>

      {/* Announcement Header Card */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900 flex-1">{announcement.title}</h1>
          <span
            className={`ml-4 inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getTypeBadgeColor(
              announcement.type
            )}`}
          >
            {announcement.type.replace("_", " ")}
          </span>
        </div>

        <p className="text-slate-700 text-lg leading-relaxed mb-8">{announcement.body}</p>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <span className="text-sm font-medium text-slate-600">Posted On</span>
            <p className="mt-1 text-slate-900 font-semibold">
              {new Date(announcement.date).toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {announcement.attachmentUrl && (
            <div className="bg-teal-50 rounded-lg p-4 md:col-span-2">
              
              <a
                href={announcement.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-teal-700 hover:text-teal-800 font-medium group"
              >
                <FileText className="w-5 h-5" />
                View attachment
                <ExternalLink className="w-4 h-4 opacity-60 group-hover:opacity-100 transition" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Read Status Section */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-5 border-b border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900">Teacher Read Status</h2>
          <p className="text-sm text-slate-600 mt-1">
            {announcement.recipients.length} teacher{announcement.recipients.length !== 1 ? "s" : ""} assigned
          </p>
        </div>

        {announcement.recipients.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 text-lg">No recipients assigned.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Teacher Name
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Read Status
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Read At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {announcement.recipients.map((recipient) => (
                  <tr
                    key={recipient.id}
                    className="hover:bg-slate-50 transition-all duration-200"
                  >
                    <td className="px-8 py-5">
                      <div className="text-sm font-medium text-slate-900">
                        {recipient.teacher.name}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-600">
                      {recipient.teacher.email || "-"}
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                          recipient.read
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }`}
                      >
                        {recipient.read ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Read
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Unread
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-600">
                      {recipient.readAt
                        ? new Date(recipient.readAt).toLocaleString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : <span className="italic text-slate-400">Not read yet</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}