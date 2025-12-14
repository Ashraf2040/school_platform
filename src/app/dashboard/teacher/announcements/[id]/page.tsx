// app/dashboard/teacher/announcements/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TeacherAnnouncementDetailPage({ params }: Props) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  // Ensure this teacher is a recipient of this announcement
  const recipient = await prisma.announcementRecipient.findFirst({
    where: { teacherId: session.user.id, announcementId: id },
    include: { announcement: true },
  });

  if (!recipient) {
    notFound();
  }

  const ann = recipient.announcement;

  return (
    <div className="mx-auto max-w-3xl py-10 px-6">
      <Link
        href="/dashboard/teacher/announcements"
        className="text-sm text-teal-600 hover:underline"
      >
        ← Back to announcements
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-slate-900">{ann.title}</h1>

      <p className="mt-2 text-sm text-slate-500">
        Posted on{" "}
        {new Date(ann.date).toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <div className="mt-6 text-slate-700 leading-relaxed whitespace-pre-line">
        {ann.body}
      </div>

      {ann.attachmentUrl && (
        <a
          href={ann.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 text-teal-600 hover:underline font-medium"
        >
          📎 View attachment
        </a>
      )}
    </div>
  );
}
