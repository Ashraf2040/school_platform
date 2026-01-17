// /app/api/leave-request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

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

    const { leaveDate, leaveTime, reason } = await req.json();

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        teacherId: teacher.id,
        leaveDate: new Date(leaveDate),
        leaveTime,
        reason,
        status: "PENDING",
      },
    });

    return NextResponse.json({ message: "تم إرسال طلب الاستئذان", leaveRequest });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ ما" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
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

    const requests = await prisma.leaveRequest.findMany({
      where: { teacherId: teacher.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ ما" }, { status: 500 });
  }
}
