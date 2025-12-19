import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";



export async function GET() {
  const years = await prisma.academicYear.findMany({
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json(years);
}