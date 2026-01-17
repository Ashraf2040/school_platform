import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!teacher) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { latitude, longitude, imageUrl } = await req.json();

    const openAttendance = await prisma.attendance.findFirst({
      where: { teacherId: teacher.id, checkOut: null },
    });

    if (openAttendance) {
      // SAFETY CHECK: Prevent accidental checkout if check-in was recent
      const now = new Date();
      const checkInTime = new Date(openAttendance.checkIn);
      const timeDifference = (now.getTime() - checkInTime.getTime()) / 1000; // in seconds

      if (timeDifference < 5) {
        return NextResponse.json({ 
          error: "تم تسجيل الدخول للتو. يرجى الانتظار قليلاً قبل تسجيل الخروج." 
        }, { status: 400 });
      }

      // Proceed with Checkout
      const updated = await prisma.attendance.update({
        where: { id: openAttendance.id },
        data: { checkOut: new Date() },
      });
      return NextResponse.json({ message: "Check-out recorded", attendance: updated });
    } else {
      // Proceed with Checkin
      const attendance = await prisma.attendance.create({
        data: {
          teacherId: teacher.id,
          checkIn: new Date(),
          latitude,
          longitude,
          imageUrl,
        },
      });
      return NextResponse.json({ message: "Check-in recorded", attendance });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}