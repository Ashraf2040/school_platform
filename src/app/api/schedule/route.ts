// app/api/schedule/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

type IncomingSchedule = {
  [dayIndex: string]: string[]; 
};

// === GET: Fetch active schedule for a class ===
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('classId');

  console.log('GET /api/schedule called with classId:', classId);

  if (!classId) {
    console.log('Missing classId');
    return NextResponse.json(
      { error: 'Missing classId query parameter' },
      { status: 400 }
    );
  }

  try {
    const schedule = await prisma.schedule.findFirst({
      where: { classId, isActive: true },
      include: {
        items: {
          select: { dayIndex: true, subjectId: true },
        },
      },
    });

    console.log('Schedule found:', schedule);

    const result: { [key: number]: string[] } = {};

    if (schedule) {
      for (const item of schedule.items) {
        if (!result[item.dayIndex]) result[item.dayIndex] = [];
        if (!result[item.dayIndex].includes(item.subjectId)) {
          result[item.dayIndex].push(item.subjectId);
        }
      }
    }

    console.log('Processed schedule result:', result);

    return NextResponse.json({ schedule: result });
  } catch (error) {
    console.error('GET /api/schedule error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}

// === POST: Create new schedule (deactivate old) ===
export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
    console.log('POST /api/schedule received body:', body);
  } catch (e) {
    console.log('Invalid JSON body');
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { classId, schedule, createdBy } = body;

  // Validation
  if (!classId || !schedule || !createdBy) {
    console.error('Missing required fields');
    return NextResponse.json(
      { error: 'Missing required fields: classId, schedule, createdBy' },
      { status: 400 }
    );
  }

  try {
    // 1. Validate Class Exists
    const classObj = await prisma.class.findUnique({
      where: { id: classId },
      select: { name: true },
    });

    if (!classObj) {
      console.error('Class not found');
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // 2. Validate User Exists (Fixes "Foreign Key Constraint" error)
    // We check if the user exists in the User table.
    // If you don't have a User table, you must use a different validation or remove this check.
    const user = await prisma.user.findUnique({
      where: { id: createdBy },
      select: { id: true },
    });

    if (!user) {
      console.error('User (Creator) not found');
      return NextResponse.json(
        { error: 'User (Creator) not found' },
        { status: 404 }
      );
    }

    // 3. Deactivate old schedules for this class
    await prisma.schedule.updateMany({
      where: { classId, isActive: true },
      data: { isActive: false },
    });

    // 4. Build items to create
    // Assuming `items` is a flat list of IDs based on the error "Argument 'start' is missing".
    // If your schema is `items ScheduleItem[]` (One-to-Many), this needs to change.
    const itemsToCreate: any[] = [];
    Object.entries(schedule).forEach(([dayIndexStr, subjectIds]) => {
      const dayIndex = parseInt(dayIndexStr, 10);
      if (isNaN(dayIndex) || !Array.isArray(subjectIds)) return;

      // ONLY ADD IDs if the relation expects a list of IDs.
      // If it expects objects, wrap them: { dayIndex, session: 0, subjectId: { connect: { id: subjectId } } }
      subjectIds.forEach((subjectId) => {
        itemsToCreate.push({
          dayIndex,
          session: 0,
          start: "08:00",  // قيمة افتراضية مناسبة
  end: "09:00",
          subject: { connect: { id: subjectId } }, // Using 'connect' for a relation of IDs
          // start: '', end: '' // Removed these if they cause issues
        });
      });
    });

    console.log('Items to create:', itemsToCreate);

    // 5. Create new active schedule
    const newSchedule = await prisma.schedule.create({
      data: {
        classId,
        name: `${classObj.name} Schedule`,
        isActive: true,
        createdBy: user.id, // Use the validated user ID
        items: { create: itemsToCreate },
      },
    });

    return NextResponse.json(
      { ok: true, schedule: newSchedule },
      { status: 201 }
    );

  } catch (error) {
    console.error('POST /api/schedule error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// === DELETE: Delete a specific schedule by ID ===
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  console.log('DELETE /api/schedule called with id:', id);

  if (!id) {
    console.log('Missing schedule ID');
    return NextResponse.json(
      { error: 'Missing schedule ID' },
      { status: 400 }
    );
  }

  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      select: { isActive: true },
    });

    console.log('Schedule found for deletion:', schedule);

    if (!schedule) {
      console.log('Schedule not found');
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    await prisma.schedule.delete({
      where: { id },
    });

    console.log('Schedule deleted:', id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/schedule error:', error);
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}