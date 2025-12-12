// src/app/api/inquests/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// GET - Fetch single inquest
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }  // ← params is a Promise!
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ← MUST await params
  const { id } = await params;

  const inquest = await prisma.inquest.findUnique({
    where: { id },
    include: {
      academicYear: true,
      createdBy: { select: { name: true } },
    },
  });

  if (!inquest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Security: Teacher can only view their own inquests
  if (session.user.role === "TEACHER" && inquest.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(inquest);
}

// PATCH - Update inquest (teacher response or admin decision)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params; // ← await here too
  const body = await request.json();

  const inquest = await prisma.inquest.findUnique({
    where: { id },
  });

  if (!inquest) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Teacher submitting response
  if (session.user.role === "TEACHER") {
    if (inquest.teacherId !== session.user.id || inquest.status !== "PENDING") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.inquest.update({
      where: { id },
      data: {
        teacherClarification: body.teacherClarification,
        attachmentUrl: body.attachmentUrl,
        status: "RESPONDED",
      },
    });
  }
  // Admin adding final decision
  else if (session.user.role === "ADMIN") {
    if (inquest.status !== "RESPONDED") {
      return NextResponse.json({ error: "Inquest not responded yet" }, { status: 400 });
    }

    await prisma.inquest.update({
      where: { id },
      data: {
        principalOpinion: body.principalOpinion,
        decisionText: body.decisionText,
        status: "COMPLETED",
      },
    });
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}