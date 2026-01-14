// src/app/api/teachers-weekly-evaluations/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Fetch all teachers with their latest report
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
          take: 1,
          select: {
            id: true,
            weekStart: true,
            weekEnd: true, // ← Added weekEnd
          },
        },
      },
    });

    // Filter based on latest report's weekStart if from/to params are provided
    let filteredTeachers = teachers;
    if (from || to) {
      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to) : null;

      filteredTeachers = teachers.filter((t) => {
        if (!t.weeklyReports.length) return false;
        const latestStart = t.weeklyReports[0].weekStart;

        if (fromDate && latestStart < fromDate) return false;
        if (toDate && latestStart > toDate) return false;
        return true;
      });
    }

    // Map the result with ISO strings
    const result = filteredTeachers.map((t) => ({
      id: t.id,
      name: t.name,
      classesTaught: t.classesTaught,
      subjectsTaught: t.subjectsTaught,
      weeklyReports: t.weeklyReports.map((r) => ({
        id: r.id,
        weekStart: r.weekStart.toISOString(),
        weekEnd: r.weekEnd ? r.weekEnd.toISOString() : null, // ← Include weekEnd
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