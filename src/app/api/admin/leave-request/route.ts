// /app/api/admin/leave-request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await prisma.leaveRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { teacher: true },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status, adminNote } = await req.json();

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedRequest = await prisma.leaveRequest.update({
      where: { id },
      data: { status, adminNote, updatedAt: new Date() },
      include: { teacher: true },
    });

    // ممكن تضيف هنا notification للمعلم عن النتيجة (بناءً على بنية إشعاراتك)

    return NextResponse.json({ message: "تم تحديث الطلب", updatedRequest });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "حدث خطأ ما" }, { status: 500 });
  }
}
