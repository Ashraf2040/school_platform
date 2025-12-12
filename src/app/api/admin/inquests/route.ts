// Updated /api/admin/inquests/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacherId") ?? undefined;

  const inquests = await prisma.inquest.findMany({
    where: teacherId ? { teacherId } : {},
    include: {
      academicYear: true,
      teacher: true,
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(inquests);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    teacherId,
    academicYearId,
    inquestType,
    reason,
    details,
    teacherJobTitle,
    teacherSpecialty,
    teacherSchool,
    clarificationRequest,
  } = body;

  if (!teacherId || !academicYearId || !inquestType || !reason) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Step 1: Create the inquest first
  const inquest = await prisma.inquest.create({
    data: {
      teacherId,
      academicYearId,
      inquestType,
      reason,
      details,
      teacherJobTitle,
      teacherSpecialty,
      teacherSchool,
      clarificationRequest,
      createdById: session.user.id,
      status: "PENDING",
    },
  });

  // Step 2: Now create the notification using the real inquest.id
  await prisma.notification.create({
    data: {
      userId: teacherId,
      title:
        inquestType === "ABSENT"
          ? "New absent inquest"
          : "New negligence inquest",
      body: reason,
      link: `/dashboard/teacher/inquests/${inquest.id}`, // Now safe to use!
    },
  });

  // Return the created inquest
  return NextResponse.json(inquest, { status: 201 });
}