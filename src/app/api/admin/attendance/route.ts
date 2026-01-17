import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch Teachers and their latest attendance
    const users = await prisma.user.findMany({
      where: { role: "TEACHER" },
      select: {
        id: true,
        name: true,
        email: true,
        attendances: {
          orderBy: { checkIn: "desc" },
          take: 1,
        },
      },
    });

    // Format Teacher Data
    const teachers = users.map((u) => {
      const attendance = u.attendances[0];
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        isPresent: attendance ? !attendance.checkOut : false,
        checkIn: attendance?.checkIn,
        checkOut: attendance?.checkOut,
      };
    });

    // 2. Fetch Pending Leave Requests with Teacher Details
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        status: "PENDING", // Only fetch pending requests
      },
      include: {
        teacher: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Newest requests first
      },
    });

    // 3. Return both Teachers and Requests
    return NextResponse.json({ teachers, leaveRequests });

  } catch (error) {
    console.error("Admin Dashboard API Error:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}