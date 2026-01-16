
// src/app/api/weekly-reports/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getServerSession } from "next-auth"; // Assuming you use NextAuth
import { authOptions } from "../../auth/[...nextauth]/route";


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
        weekEnd: true,
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

    // Serialize dates to ISO strings for client
    const serialized = {
      ...report,
      weekStart: report.weekStart.toISOString(),
      weekEnd: report.weekEnd ? report.weekEnd.toISOString() : null,
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // 1. Authentication Check
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 2. Authorization & Ownership Check
    const existingReport = await prisma.weeklyReport.findUnique({
      where: { id },
      select: { teacherId: true, teacherData: true },
    });

    if (!existingReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Only the teacher who owns the report (or an admin) can update it
    // Assuming session.user.role is available, otherwise just checking ID
    if (session.user.id !== existingReport.teacherId && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const updateData: Record<string, any> = {};

    // 3. Helper to save files locally
    const saveFile = async (file: File): Promise<string> => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Create unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename = uniqueSuffix + '-' + file.name.replace(/\s+/g, '_');
      
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      await writeFile(join(uploadDir, filename), buffer);
      
      return `/uploads/${filename}`;
    };

    // 4. Iterate FormData to build update object
    // We keep track of keys to handle arrays correctly
    for (const [key, value] of formData.entries()) {
      const allValues = formData.getAll(key);

      // If a key appears multiple times, it's an array
      if (allValues.length > 1) {
        updateData[key] = allValues;
        continue;
      }

      // Handle File Uploads
      if (value instanceof File) {
        // Only upload if a file was actually selected (size > 0)
        if (value.size > 0) {
          const url = await saveFile(value);
          updateData[key] = url;
        }
        // If size is 0, user didn't select a file, so we don't update this field
        // (This preserves the existing file URL in the DB)
        continue;
      }

      // Handle Strings and Booleans
      if (value === "true") {
        updateData[key] = true;
      } else if (value === "false") {
        updateData[key] = false;
      } else {
        updateData[key] = value;
      }
    }

    // 5. Merge with existing teacherData
    // We merge so that fields not sent in the form (like unchanged files) are preserved.
    const mergedTeacherData = {
      ...(existingReport.teacherData as Record<string, any>),
      ...updateData,
    };

    // 6. Update Database
    const updatedReport = await prisma.weeklyReport.update({
      where: { id },
      data: {
        teacherData: mergedTeacherData,
        // Optionally update 'submittedAt' if you want to track last edit time for Part 1
        submittedAt: new Date(), 
      },
    });

    return NextResponse.json(
      { 
        message: "Report updated successfully", 
        id: updatedReport.id 
      }, 
      { status: 200 }
    );

  } catch (e) {
    console.error("[weekly-report PUT] ERROR:", e);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}
