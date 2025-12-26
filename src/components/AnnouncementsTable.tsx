// app/[locale]/dashboard/admin/announcements/AnnouncementsTable.tsx

"use client";

import { useRouter } from "next/navigation";
import { FileText, ExternalLink } from "lucide-react"; // Optional: install lucide-react for icons

type Announcement = {
  id: string;
  title: string;
  type: "GENERAL" | "TARGETED" | "DRAW_ATTENTION";
  date: string | Date;
  attachmentUrl: string | null;
};

type Props = {
  announcements: Announcement[];
  locale: string;
};

export default function AnnouncementsTable({ announcements, locale }: Props) {
  const router = useRouter();

  if (announcements.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-lg">No announcements yet.</p>
      </div>
    );
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
    <div className="overflow-x-auto rounded-xl shadow-lg">
      <table className="min-w-full bg-white">
        <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Title
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Attachment
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {announcements.map((a) => (
            <tr
              key={a.id}
              className="hover:bg-slate-50 cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-[1.001]"
              onClick={() => router.push(`/dashboard/admin/announcements/${a.id}`)}
            >
              <td className="px-6 py-5 whitespace-nowrap">
                <div className="text-sm font-medium text-slate-900 line-clamp-2">
                  {a.title}
                </div>
              </td>

              <td className="px-6 py-5 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTypeBadgeColor(
                    a.type
                  )}`}
                >
                  {a.type.replace("_", " ")}
                </span>
              </td>

              <td className="px-6 py-5 text-sm text-slate-600 whitespace-nowrap">
                {new Date(a.date).toLocaleDateString(locale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </td>

              <td className="px-6 py-5 text-sm whitespace-nowrap">
                {a.attachmentUrl ? (
                  <a
                    href={a.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-medium group"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FileText className="w-4 h-4" />
                    View attachment
                    <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition" />
                  </a>
                ) : (
                  <span className="text-slate-400 italic">None</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}