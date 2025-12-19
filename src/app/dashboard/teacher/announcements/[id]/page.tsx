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
    <div className="mx-auto max-w-3xl py-12 px-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      <Link
        href="/dashboard/teacher/announcements"
        className="inline-block mb-6 text-sm text-teal-600 hover:underline transition"
      >
        ← Back to announcements
      </Link>

      <h1 className="mb-2 text-4xl font-extrabold text-gray-900 tracking-tight">
        {ann.title}
      </h1>

      <p className="text-sm text-gray-500 italic">
        Posted on{" "}
        {new Date(ann.date).toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <hr className="my-6 border-gray-300" />

      <div className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
        {ann.body}
      </div>

      {ann.attachmentUrl && (
        <a
          href={ann.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 text-teal-600 hover:underline font-semibold text-base transition"
        >
          📎 View attachment
        </a>
      )}
    </div>
  );
}
