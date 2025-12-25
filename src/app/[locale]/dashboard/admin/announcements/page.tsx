// ⛔️ مهم جدًا: لازم السطر ده يكون فوق خالص
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AnnouncementsFilter from "@/components/AnnouncementsFilter";
import AnnouncementsTable from "@/components/AnnouncementsTable";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminAnnouncementsPage({
  params,
  searchParams,
}: PageProps) {
  // فك الـ Promise
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const { locale } = resolvedParams;

  /* ================= AUTH ================= */
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  /* ================= FILTERS ================= */
  const typeFilter =
    typeof resolvedSearchParams.type === "string"
      ? (resolvedSearchParams.type.toUpperCase() as
          | "GENERAL"
          | "TARGETED"
          | "DRAW_ATTENTION")
      : undefined;

  const fromFilter =
    typeof resolvedSearchParams.from === "string" ? resolvedSearchParams.from : undefined;

  const toFilter =
    typeof resolvedSearchParams.to === "string" ? resolvedSearchParams.to : undefined;

  /* ================= PRISMA WHERE ================= */
  const where: {
    type?: "GENERAL" | "TARGETED" | "DRAW_ATTENTION";
    date?: {
      gte?: Date;
      lte?: Date;
    };
  } = {};

  // type
  if (
    typeFilter &&
    ["GENERAL", "TARGETED", "DRAW_ATTENTION"].includes(typeFilter)
  ) {
    where.type = typeFilter;
  }

  // date
  if (fromFilter || toFilter) {
    where.date = {};

    if (fromFilter) {
      const from = new Date(fromFilter);
      if (!isNaN(from.getTime())) {
        from.setHours(0, 0, 0, 0);
        where.date.gte = from;
      }
    }

    if (toFilter) {
      const to = new Date(toFilter);
      if (!isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        where.date.lte = to;
      }
    }
  }

  /* ================= QUERY ================= */
  const announcements = await prisma.announcement.findMany({
    where,
    orderBy: { date: "desc" },
  });

  /* ================= UI ================= */
  return (
    <div className="mx-auto w-4/5 py-10 px-6 ">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        Create New Announcement
      </h1>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <Link
          href="/dashboard/admin/announcements/create?type=general"
          className="block p-8 rounded-2xl bg-white shadow-md border-2 border-dashed border-slate-300 hover:border-teal-500 hover:shadow-lg transition"
        >
          <div className="text-center">
            <span className="text-6xl mb-4 block">🌐</span>
            <h2 className="text-2xl font-bold text-slate-900">
              General Announcement
            </h2>
            <p
              className="mt-3 text-slate-600"
              dangerouslySetInnerHTML={{
                __html:
                  "Sent to <strong>all teachers</strong> in the school.",
              }}
            />
          </div>
        </Link>

        <Link
          href="/dashboard/admin/announcements/create?type=targeted"
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
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">
          All Announcements ({announcements.length})
        </h2>

        <AnnouncementsFilter
          currentType={typeFilter}
          currentFrom={fromFilter}
          currentTo={toFilter}
        />

        <AnnouncementsTable
          announcements={announcements}
          locale={locale}
        />
      </div>
    </div>
  );
}
