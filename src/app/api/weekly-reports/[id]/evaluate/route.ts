// app/api/weekly-reports/[id]/evaluate/route.ts
import { NextRequest, NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


// Important: Use async function with context.params (no destructuring here in some cases)
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } // ← params is Promise
) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // Await the params Promise
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "معرف التقرير مفقود" }, { status: 400 });
  }

  try {
    const body = await req.json();

    const updatedReport = await prisma.weeklyReport.update({
      where: { id },  // ← Now id is awaited and safe
      data: {
        adminData: body,
        evaluatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error("خطأ في حفظ التقييم:", error);
    return NextResponse.json(
      { error: "فشل في حفظ التقييم", details: (error as Error).message },
      { status: 500 }
    );
  }
}