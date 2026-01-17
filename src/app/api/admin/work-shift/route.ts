import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to safely create a Date object from a base date and time string (HH:mm)
const setDateTime = (baseDate: Date, timeString: string) => {
  const date = new Date(baseDate);
  const [hours, minutes] = timeString.split(":").map(Number);
  
  // Validate HH:mm format
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error("Invalid time format");
  }

  date.setHours(hours, minutes, 0, 0);
  return date;
};

export async function GET() {
  try {
    // Get the start of the current day (Local Time)
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    // Find the work shift for today
    const workShift = await prisma.workShift.findFirst({
      where: {
        date: startOfDay,
      },
    });

    return NextResponse.json({ workShift });
  } catch (error) {
    console.error("Error fetching work shift:", error);
    return NextResponse.json({ error: "فشل جلب دوام اليوم" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { startTime, endTime } = body;

    // Validation
    if (!startTime || typeof startTime !== "string") {
      return NextResponse.json({ error: "وقت بداية الدوام مطلوب" }, { status: 400 });
    }

    // Define today's date start (00:00:00)
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    // Prepare date objects using the helper
    const shiftStartObj = setDateTime(startOfDay, startTime);
    const shiftEndObj = endTime ? setDateTime(startOfDay, endTime) : null;

    // Check if a record exists for today
    let workShift = await prisma.workShift.findFirst({
      where: {
        date: startOfDay,
      },
    });

    if (workShift) {
      // Update existing record
      workShift = await prisma.workShift.update({
        where: { id: workShift.id },
        data: {
          startTime: shiftStartObj,
          endTime: shiftEndObj,
        },
      });
    } else {
      // Create new record
      workShift = await prisma.workShift.create({
        data: {
          date: startOfDay,
          startTime: shiftStartObj,
          endTime: shiftEndObj,
        },
      });
    }

    return NextResponse.json({ workShift });
  } catch (error) {
    console.error("Error saving work shift:", error);
    return NextResponse.json({ error: "فشل حفظ دوام اليوم" }, { status: 500 });
  }
}