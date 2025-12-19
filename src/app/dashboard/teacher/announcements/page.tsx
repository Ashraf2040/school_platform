import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

interface Props {
  searchParams?: {
    type?: string;
  };
}

export default async function TeacherAnnouncementsListPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const filterType = resolvedSearchParams?.type || "all";

  const whereCondition: any = {
    recipients: {
      some: {
        teacherId: session.user.id,
      },
    },
  };

  if (filterType === "TARGETED") {
    whereCondition.OR = [
      { type: "TARGETED" },
      { type: "DRAW_ATTENTION" },
    ];
  } else if (filterType !== "all") {
    whereCondition.type = filterType;
  }

  const announcements = await prisma.announcement.findMany({
    where: whereCondition,
    orderBy: {
      date: "desc",
    },
  });

  const filterOptions = [
    { label: "All", value: "all" },
    { label: "General", value: "GENERAL" },
    { label: "Targeted + Draw Attention", value: "TARGETED" },
  ];

  return (
    <div className="mx-auto max-w-4xl py-10 px-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Announcements</h1>
      <p className="text-slate-600 mb-4">All announcements shared with you.</p>

      <div className="mb-6 flex space-x-4">
        {filterOptions.map((opt) => (
          <Link
            key={opt.value}
            href={`/dashboard/teacher/announcements${opt.value === "all" ? "" : `?type=${opt.value}`}`}
            className={`px-4 py-2 rounded-md border ${
              filterType === opt.value
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-blue-600 border-blue-600 hover:bg-blue-50"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {announcements.length === 0 ? (
        <p className="text-slate-500">No announcements yet.</p>
      ) : (
        <ul className="space-y-4">
          {announcements.map((ann) => (
            <li
              key={ann.id}
              className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition"
            >
              <Link href={`/dashboard/teacher/announcements/${ann.id}`} className="block">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-semibold text-slate-900">{ann.title}</h2>
                  <span className="text-xs uppercase text-slate-500">{ann.type}</span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{ann.body}</p>
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
