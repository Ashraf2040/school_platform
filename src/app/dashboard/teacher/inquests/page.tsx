// Updated Teacher Inquests List Page: /app/dashboard/teacher/inquests/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import Link from "next/link";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

export default async function TeacherInquestsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  const inquests = await prisma.inquest.findMany({
    where: {
      teacherId: session.user.id,
    },
    include: {
      academicYear: true,
      createdBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 font-['Noto_Sans_Arabic',sans-serif]">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Inquests</h1>
        <p className="text-sm text-slate-500 mt-1">
          View all inquests issued to you by the administration.
        </p>
      </div>

      {inquests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <div className="text-slate-400 text-lg font-medium">
            No inquests found
          </div>
          <p className="text-sm text-slate-500 mt-2">
            You have not received any inquests yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {inquests.map((inquest) => (
            <Link
              key={inquest.id}
              href={`/dashboard/teacher/inquests/${inquest.id}`}
              className="block bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        inquest.inquestType === "ABSENT"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {inquest.inquestType === "ABSENT"
                        ? "Absent Inquest"
                        : "Negligence in Work"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(inquest.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mt-3">
                    {inquest.reason}
                  </h3>
                </div>
                <span
                  className={`text-xs font-medium ${
                    inquest.status === "PENDING" ? "text-yellow-600" :
                    inquest.status === "RESPONDED" ? "text-blue-600" :
                    "text-green-600"
                  }`}
                >
                  {inquest.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          href="/dashboard/teacher"
          className="text-sm text-teal-600 hover:text-teal-700 font-medium"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}