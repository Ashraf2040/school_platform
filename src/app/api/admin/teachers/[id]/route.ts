import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }  // <-- Type as Promise
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;  // <-- Await here
  const teacherId = resolvedParams.id;  // Now safe to access .id

  const body = await request.json();
  const { username, name, email, password, classIds = [], subjectIds = [] } = body;

  const updateData: any = { username, name, email };

  if (password && password.trim()) {
    updateData.password = password.trim();  // Plain text, as per your request
  }

  // Sync class assignments
  await prisma.classOnTeacher.deleteMany({ where: { teacherId } });
  if (classIds.length > 0) {
    await prisma.classOnTeacher.createMany({
      data: classIds.map((classId: string) => ({
        teacherId,
        classId,
      })),
    });
  }

  // Sync subject assignments
  await prisma.subjectOnTeacher.deleteMany({ where: { teacherId } });
  if (subjectIds.length > 0) {
    await prisma.subjectOnTeacher.createMany({
      data: subjectIds.map((subjectId: string) => ({
        teacherId,
        subjectId,
      })),
    });
  }

  const updated = await prisma.user.update({
    where: { id: teacherId },
    data: updateData,
    include: {
      classes: { include: { class: true } },
      subjects: { include: { subject: true } },
      teacherProfile: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }  // <-- Type as Promise
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;  // <-- Await here
  const teacherId = resolvedParams.id;

  await prisma.user.delete({ where: { id: teacherId } });
  return NextResponse.json({ message: "Deleted" });
}