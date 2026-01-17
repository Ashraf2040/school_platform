import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

// --- GET Handler: Fetch User's Current Attendance Status ---
export async function GET(req: NextRequest) {
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

    // Get Today's Date Range
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Find attendance record for TODAY (ignoring old records)
    const attendance = await prisma.attendance.findFirst({
      where: {
        teacherId: teacher.id,
        checkIn: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { checkIn: "desc" },
    });

    return NextResponse.json({ attendance }); // Returns null if no record today
  } catch (error) {
    console.error("GET Attendance Error:", error);
    return NextResponse.json({ error: "Error fetching attendance" }, { status: 500 });
  }
}

// --- POST Handler: Toggle Check-In / Check-Out ---
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

    // Find most recent open attendance record
    const openAttendance = await prisma.attendance.findFirst({
      where: { 
        teacherId: teacher.id, 
        checkOut: null 
      },
      orderBy: { checkIn: 'desc' } // FIX: Always get the latest record
    });

    if (openAttendance) {
      // --- CHECKOUT LOGIC ---
      const now = new Date();
      const checkInTime = new Date(openAttendance.checkIn);
      
      // SAFETY 1: Prevent accidental checkout if check-in was recent
      const timeDifference = (now.getTime() - checkInTime.getTime()) / 1000; 
      if (timeDifference < 15) {
        return NextResponse.json({ 
          error: "تم تسجيل الدخول للتو. يرجى الانتظار قليلاً." 
        }, { status: 400 });
      }

      // SAFETY 2: Don't close old records (from previous days)
      const isToday = checkInTime.toDateString() === now.toDateString();
      if (!isToday) {
         // This is an old record, ignore it and create a new one below
      } else {
        // Proceed with Checkout
        const updated = await prisma.attendance.update({
          where: { id: openAttendance.id },
          data: { checkOut: new Date() },
        });
        return NextResponse.json({ message: "Check-out recorded", attendance: updated });
      }
    }

    // --- CHECKIN LOGIC ---
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

  } catch (error) {
    console.error("POST Attendance Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}