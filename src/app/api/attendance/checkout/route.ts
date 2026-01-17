import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!teacher) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // إيجاد آخر تسجيل دخول بدون خروج
    const openAttendance = await prisma.attendance.findFirst({
      where: { teacherId: teacher.id, checkOut: null },
      orderBy: { checkIn: "desc" },
    });

    if (!openAttendance) {
      return NextResponse.json({ error: "لا يوجد تسجيل حضور مفتوح" }, { status: 400 });
    }

    // تحديث وقت الخروج
    const updatedAttendance = await prisma.attendance.update({
      where: { id: openAttendance.id },
      data: { checkOut: new Date() },
    });

    return NextResponse.json({ message: "تم تسجيل الخروج", attendance: updatedAttendance });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ أثناء تسجيل الخروج" }, { status: 500 });
  }
}
