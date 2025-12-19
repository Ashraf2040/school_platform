import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

type IncomingSchedule = {
  [dayIndex: string]: string[]; // array of subject IDs per day
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

  const { classId, schedule, createdBy } = body as {
    classId: string;
    schedule: IncomingSchedule;
    createdBy: string;
  };

  if (!classId || !schedule || !createdBy) {
    console.log('Missing required fields:', { classId, schedule, createdBy });
    return NextResponse.json(
      { error: 'Missing required fields: classId, schedule, createdBy' },
      { status: 400 }
    );
  }

  try {
    // Validate class exists
    const classObj = await prisma.class.findUnique({
      where: { id: classId },
      select: { name: true },
    });

    console.log('Class object found:', classObj);

    if (!classObj) {
      console.log('Class not found');
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Deactivate all active schedules for this class
    const updatedSchedules = await prisma.schedule.updateMany({
      where: { classId, isActive: true },
      data: { isActive: false },
    });

    console.log('Deactivated schedules count:', updatedSchedules.count);

    // Build items to create
    const itemsToCreate: any[] = [];

    Object.entries(schedule).forEach(([dayIndexStr, subjectIds]) => {
      const dayIndex = parseInt(dayIndexStr, 10);
      if (isNaN(dayIndex) || !Array.isArray(subjectIds)) return;

      subjectIds.forEach((subjectId) => {
        itemsToCreate.push({
          dayIndex,
          session: 0,
          subject: { connect: { id: subjectId } },
          start: '',
          end: '',
        });
      });
    });

    console.log('Items to create:', itemsToCreate);

    // Create new active schedule
    const newSchedule = await prisma.schedule.create({
      data: {
        classId,
        name: classObj.name,
        isActive: true,
        createdBy,
        items: { create: itemsToCreate },
      },
      include: {
        items: {
          select: { dayIndex: true, subjectId: true },
        },
      },
    });

    console.log('New schedule created:', newSchedule);

    return NextResponse.json(
      { ok: true, schedule: newSchedule },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/schedule error:', error);
    return NextResponse.json(
      { error: 'Failed to save schedule' },
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
