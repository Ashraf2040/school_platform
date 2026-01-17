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

    // تحقق لو موجود تسجيل دخول بدون خروج سابق
    const openAttendance = await prisma.attendance.findFirst({
      where: { teacherId: teacher.id, checkOut: null },
    });

    if (openAttendance) {
      return NextResponse.json({ error: "لقد قمت بتسجيل حضور سابق بدون تسجيل خروج" }, { status: 400 });
    }

    // إنشاء تسجيل دخول جديد
    const attendance = await prisma.attendance.create({
      data: {
        teacherId: teacher.id,
        checkIn: new Date(),
      },
    });

    return NextResponse.json({ message: "تم تسجيل الحضور", attendance });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ أثناء تسجيل الحضور" }, { status: 500 });
  }
}
