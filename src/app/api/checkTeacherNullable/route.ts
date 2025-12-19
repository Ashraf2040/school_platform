import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";  // عدل المسار حسب مشروعك

export async function GET() {
  try {
    const result = await prisma.$queryRaw<
      { column_name: string; is_nullable: string }[]
    >`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'ScheduleItem' AND column_name = 'teacherId';
    `;

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error checking nullable:", error);
    return NextResponse.json(
      { error: "Failed to check nullable status" },
      { status: 500 }
    );
  }
}
