// src/app/api/teachers-weekly-evaluations/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    // Note: We no longer strictly need 'from' and 'to' on the server
    // because we will fetch all reports and filter on the client.
    // This allows instant switching between date ranges without reloading.
    
    // Fetch all teachers with ALL their weekly reports
    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER" },
      select: {
        id: true,
        name: true,
        classesTaught: {
          select: {
            class: { select: { id: true, name: true } },
          },
        },
        subjectsTaught: {
          select: {
            subject: { select: { id: true, name: true } },
          },
        },
        weeklyReports: {
          orderBy: { weekStart: "desc" },
          // REMOVED take: 1 to get all reports
          select: {
            id: true,
            weekStart: true,
            weekEnd: true,
          },
        },
      },
    });

    // Map the result with ISO strings
    const result = teachers.map((t) => ({
      id: t.id,
      name: t.name,
      classesTaught: t.classesTaught,
      subjectsTaught: t.subjectsTaught,
      weeklyReports: t.weeklyReports.map((r) => ({
        id: r.id,
        weekStart: r.weekStart.toISOString(),
        weekEnd: r.weekEnd ? r.weekEnd.toISOString() : null,
      })),
    }));

    return NextResponse.json(result);
  } catch (e) {
    console.error("[weekly-evals] ERROR:", e);
    return NextResponse.json(
      { error: "Failed to fetch weekly evaluations" },
      { status: 500 }
    );
  }
}