// app/dashboard/admin/announcements/create/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import CreateAnnouncementForm from "@/components/CreateAnnouncementForm";

type SearchParams = Promise<{ type?: string }>;

type PageProps = {
  searchParams: SearchParams;
};

export default async function CreateAnnouncementPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const sp = await searchParams; // 🔴 IMPORTANT: await the promise
  console.log("[CreateAnnouncementPage] raw searchParams =", sp);
  console.log("[CreateAnnouncementPage] raw type =", sp.type);

  const type: "general" | "targeted" =
    sp.type === "targeted" ? "targeted" : "general";
  console.log("[CreateAnnouncementPage] resolved type =", type);

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    select: { id: true, name: true },
  });

  const subjects = await prisma.subject.findMany({
    select: {
      id: true,
      name: true,
      teachers: { select: { teacher: { select: { id: true } } } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl py-10 px-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">
        {type === "general"
          ? "Create General Announcement"
          : "Create Targeted Announcement"}
      </h1>

      <CreateAnnouncementForm type={type} teachers={teachers} subjects={subjects} />
    </div>
  );
}
