// src/app/api/lessons/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";  // ← Use singleton

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    classId,
    subjectId,
    date,
    unit,
    lesson,
    pages,
    objective,
    homework,
    comments,
  } = await req.json();

  if (!classId || !subjectId || !date || !unit || !lesson || !pages || !objective) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Build a full UTC day window for the submitted date (prevents TZ mismatches)
  const dayIso = new Date(date).toISOString().slice(0, 10);
  const start = new Date(`${dayIso}T00:00:00.000Z`);
  const end = new Date(`${dayIso}T23:59:59.999Z`);

  // Guard: one lesson per teacher + class + subject per day
  const exists = await prisma.lesson.findFirst({
    where: {
      teacherId: session.user.id,
      classId,
      subjectId,
      date: { gte: start, lte: end },
    },
  });

  if (exists) {
    return NextResponse.json(
      { error: "You already submitted a lesson for this class, subject, and date." },
      { status: 409 }
    );
  }

  const created = await prisma.lesson.create({
    data: {
      teacherId: session.user.id,
      classId,
      subjectId,
      date: new Date(date),
      unit,
      pages,
      lesson,
      objective,
      homework,
      comments,
    },
    include: { class: true, subject: true },
  });

  return NextResponse.json(created, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacherId");
  const classId = searchParams.get("classId");
  const date = searchParams.get("date");

  try {
    const whereClause: any = {};

    if (teacherId) whereClause.teacherId = teacherId;
    if (classId) whereClause.classId = classId;

    if (date) {
      const dayIso = new Date(date).toISOString().slice(0, 10);
      whereClause.date = {
        gte: new Date(`${dayIso}T00:00:00.000Z`),
        lte: new Date(`${dayIso}T23:59:59.999Z`),
      };
    }

    const lessons = await prisma.lesson.findMany({
      where: whereClause,
      include: {
        teacher: { select: { id: true, name: true, username: true } },
        class: true,
        subject: true,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return NextResponse.json({ error: "Failed to fetch lessons" }, { status: 500 });
  }
}