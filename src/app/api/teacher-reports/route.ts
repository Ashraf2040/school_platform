// src/app/api/weekly-reports/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { weeklyReportSchema } from "@/lib/validations/weeklyReport.schema";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    // Get authenticated teacher
    const session = await getServerSession(authOptions);
    const teacherId = session?.user?.id;

    if (!teacherId) {
      return NextResponse.json(
        { success: false, message: "غير مصرح لك بالوصول" },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    // Convert FormData to plain object
    const rawData: Record<string, any> = {};

    formData.forEach((value, key) => {
      if (rawData[key]) {
        rawData[key] = Array.isArray(rawData[key])
          ? [...rawData[key], value]
          : [rawData[key], value];
      } else {
        rawData[key] = value;
      }
    });

    // Convert string "true"/"false" → boolean
    const booleanFields = [
      "preparedLessonPlans",
      "usedVariedMethods",
      "studentsEngaged",
      "maintainedPositiveEnvironment",
      "providedClearFeedback",
      "usedDigitalPlatform",
      "monitoredAssignments",
    ];

    booleanFields.forEach((field) => {
      if (field in rawData) {
        rawData[field] = rawData[field] === "true";
      }
    });

    // Ensure array fields are always arrays
    const arrayFields = [
      "teachingMethods",
      "gradesTaught",
      "environmentCommentsType",
      "feedbackQuality",
      "atRiskStudentsReasons",
      "highPerformingStudentsReasons",
      "issues",
    ];

    arrayFields.forEach((field) => {
      if (!rawData[field]) {
        rawData[field] = [];
      } else if (!Array.isArray(rawData[field])) {
        rawData[field] = [rawData[field]];
      }
    });

    // Validate with zod schema
    const validatedData = weeklyReportSchema.parse(rawData);

    // ─────────────────────────────────────────────
    //              Important date logic
    // ─────────────────────────────────────────────
    const weekStartDate = new Date(validatedData.weekFrom);
    const weekEndDate = new Date(validatedData.weekTo);

    // Basic date validation (client should also do this)
    if (isNaN(weekStartDate.getTime()) || isNaN(weekEndDate.getTime())) {
      return NextResponse.json(
        { success: false, message: "تواريخ غير صالحة" },
        { status: 400 }
      );
    }

    if (weekStartDate > weekEndDate) {
      return NextResponse.json(
        {
          success: false,
          message: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية",
        },
        { status: 400 }
      );
    }

    // Create the weekly report
    const report = await prisma.weeklyReport.create({
      data: {
        teacherId,
        weekStart: weekStartDate,
        weekEnd: weekEndDate,           // ← new field
        teacherData: validatedData as any, // or JSON.stringify if you prefer
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم حفظ التقرير الأسبوعي بنجاح",
        data: {
          id: report.id,
          weekStart: report.weekStart.toISOString(),
          weekEnd: report.weekEnd?.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API /weekly-reports POST error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "بيانات غير صالحة",
          errors: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "حدث خطأ أثناء حفظ التقرير" },
      { status: 500 }
    );
  }
}

// ADD THIS GET HANDLER to your existing /api/weekly-reports/route.ts
export async function GET(req: Request) {
  try {
    console.log('🔍 GET /api/weekly-reports')
    
    const session = await getServerSession(authOptions)
    const teacherId = session?.user?.id
    console.log('👤 Teacher ID:', teacherId)

    if (!teacherId) {
      return NextResponse.json({ success: false, message: "غير مصرح" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const classId = searchParams.get('classId')

    // ✅ FIXED: Simple base query
    const where: any = { teacherId }

    // Date filters (optional)
    const dateFilter: any = {}
    if (dateFrom) dateFilter.gte = new Date(dateFrom)
    if (dateTo) dateFilter.lte = new Date(dateTo)
    
    if (Object.keys(dateFilter).length > 0) {
      where.weekStart = dateFilter
    }

    // Class filter (optional)
    if (classId) {
      where.teacherData = {
        path: ['classId'],
        equals: classId
      }
    }

    console.log('🔍 WHERE:', JSON.stringify(where, null, 2))

    const reports = await prisma.weeklyReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        weekStart: true,
        weekEnd: true,
        teacherData: true,
        createdAt: true,
      }
    })

    console.log('📊 Reports:', reports.length)
    return NextResponse.json({ success: true, data: reports, count: reports.length })

  } catch (error) {
    console.error('💥 GET ERROR:', error)
    return NextResponse.json({ success: false, message: "خطأ", error: String(error) }, { status: 500 })
  }
}

