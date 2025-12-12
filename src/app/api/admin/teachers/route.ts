import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";  // ← Add this import

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      teacherProfile: {
        select: { jobTitle: true, specialty: true, schoolName: true },
      },
      classes: {
        select: { class: { select: { id: true, name: true } } },
      },
      subjects: {
        select: { subject: { select: { id: true, name: true } } },
      },
    },
  });

  const formatted = teachers.map((t) => ({
    id: t.id,
    username: t.username,
    name: t.name,
    email: t.email,
    teacherProfile: t.teacherProfile,
    classes: t.classes.map((c) => c.class),
    subjects: t.subjects.map((s) => s.subject),
  }));

  return NextResponse.json(formatted);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { username, name, email, password, classIds = [], subjectIds = [] } = body;

  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  // ← Replace Bun with bcryptjs
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const teacher = await prisma.user.create({
      data: {
        username,
        name,
        email,
        password: hashedPassword,
        role: "TEACHER",
        classes: {
          create: classIds.map((classId: string) => ({
            class: { connect: { id: classId } },
          })),
        },
        subjects: {
          create: subjectIds.map((subjectId: string) => ({
            subject: { connect: { id: subjectId } },
          })),
        },
        teacherProfile: {
          create: {},
        },
      },
      include: {
        classes: { include: { class: true } },
        subjects: { include: { subject: true } },
        teacherProfile: true,
      },
    });

    return NextResponse.json(teacher, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create teacher" }, { status: 500 });
  }
}