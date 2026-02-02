// app/api/admin/inquests/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

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
  
  // 1. DESTRUCTURE: Added 'date' here
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
    date, 
  } = body;

  // 2. VALIDATE: Added check for date
  if (!teacherId || !academicYearId || !inquestType || !reason || !date) {
    return NextResponse.json(
      { error: "Missing required fields (including date)" },
      { status: 400 }
    );
  }

  // Step 1: Create the inquest
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
      
      // 3. SAVE: Pass the date to the database here
      date: new Date(date), 
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
      link: `/dashboard/teacher/inquests/${inquest.id}`,
    },
  });

  // Return the created inquest
  return NextResponse.json(inquest, { status: 201 });
}