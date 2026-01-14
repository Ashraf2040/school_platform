// src/app/api/weekly-reports/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Await params in Next.js 15+
     
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Valid report id is required" },
        { status: 400 }
      );
    }

    const report = await prisma.weeklyReport.findUnique({
      where: { id },
      select: {
        id: true,
        teacherId: true,
        weekStart: true,
        teacherData: true,
        adminData: true,
        submittedAt: true,
        evaluatedAt: true,
        createdAt: true,
        updatedAt: true,
        teacher: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            classesTaught: {
              select: {
                class: {
                  select: { id: true, name: true },
                },
              },
            },
            subjectsTaught: {
              select: {
                subject: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Weekly report not found" },
        { status: 404 }
      );
    }

    // Serialize dates to ISO strings for the client
    const serialized = {
      ...report,
      weekStart: report.weekStart.toISOString(),
      submittedAt: report.submittedAt
        ? report.submittedAt.toISOString()
        : null,
      evaluatedAt: report.evaluatedAt
        ? report.evaluatedAt.toISOString()
        : null,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    };

    return NextResponse.json(serialized, { status: 200 });
  } catch (e) {
    console.error("[weekly-report GET by id] ERROR:", e);
    return NextResponse.json(
      { error: "Failed to fetch weekly report" },
      { status: 500 }
    );
  }
}
