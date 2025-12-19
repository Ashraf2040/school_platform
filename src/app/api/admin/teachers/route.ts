// src/app/api/admin/teachers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER" },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        password: true,
        jobTitle: true,     // ← Direct field on User
        specialty: true,    // ← Direct field on User
        schoolName: true,   // ← Direct field on User
        classesTaught: {    // ← Correct relation name
          select: {
            class: {
              select: { id: true, name: true },
            },
          },
        },
        subjectsTaught: {   // ← Correct relation name
          select: {
            subject: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Flatten the nested structure for frontend convenience
    const formatted = teachers.map((t) => ({
      id: t.id,
      username: t.username,
      name: t.name,
      email: t.email || null,
      jobTitle: t.jobTitle,
      specialty: t.specialty,
      schoolName: t.schoolName,
      password: t.password,
      classes: t.classesTaught.map((c) => c.class),
      subjects: t.subjectsTaught.map((s) => s.subject),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    username,
    name,
    email = null,
    password,
    classIds = [],
    subjectIds = [],
    specialty = null,
    jobTitle = null,
    schoolName = "Your School Name", // optional, set default or make required
  } = body;

  if (!username || !name || !password) {
    return NextResponse.json(
      { error: "Username, name, and password are required" },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const teacher = await prisma.user.create({
      data: {
        username,
        name,
        email,
        password: hashedPassword,
        role: "TEACHER",
        specialty,
        jobTitle,
        schoolName,
        // Connect classes via the join table
        classesTaught: {
          create: classIds.map((classId: string) => ({
            class: { connect: { id: classId } },
          })),
        },
        // Connect subjects via the join table
        subjectsTaught: {
          create: subjectIds.map((subjectId: string) => ({
            subject: { connect: { id: subjectId } },
          })),
        },
      },
      include: {
        classesTaught: { include: { class: true } },
        subjectsTaught: { include: { subject: true } },
      },
    });

    // Format response same as GET
    const formatted = {
      id: teacher.id,
      username: teacher.username,
      name: teacher.name,
      email: teacher.email,
      jobTitle: teacher.jobTitle,
      specialty: teacher.specialty,
      schoolName: teacher.schoolName,
      classes: teacher.classesTaught.map((c) => c.class),
      subjects: teacher.subjectsTaught.map((s) => s.subject),
    };

    return NextResponse.json(formatted, { status: 201 });
  } catch (error: any) {
    console.error("Error creating teacher:", error);

    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] || "username/email";
      return NextResponse.json(
        { error: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Failed to create teacher" }, { status: 500 });
  }
}