// app/api/announcements/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, body, type = "GENERAL", teacherIds } = await req.json();

    if (!title || !body || !Array.isArray(teacherIds) || teacherIds.length === 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Create announcement
    const announcement = await prisma.announcement.create({
      data: {
        title,
        body,
        type,
        date: new Date(),
        createdById: session.user.id as string, // ← This satisfies the required createdBy field
      },
    });

    // Link to specific teachers
    await prisma.announcementRecipient.createMany({
      data: teacherIds.map((teacherId: string) => ({
        announcementId: announcement.id,
        teacherId,
        read: false,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, announcement });
  } catch (error) {
    console.error("Announcement error:", error);
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}