import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date');

  if (!dateStr) {
    return NextResponse.json({ error: 'Missing date query parameter' }, { status: 400 });
  }

  const date = new Date(dateStr);
  const dayIndex = date.getDay();

  try {
    // جلب كل جلسات الجدول لهذا اليوم مع المعلم، الصف، والموضوع
    const sessions = await prisma.scheduleItem.findMany({
      where: { dayIndex },
      include: {
        teacher: true,
        schedule: {
          select: {
            classId: true,
            class: { select: { name: true } },
          },
        },
        subject: true,
      },
    });

    // تجميع بيانات المعلمين مع دروسهم حسب اليوم
    const teachersMap = new Map<
      string,
      {
        teacherId: string;
        teacherName: string;
        classes: Set<string>;
        subjects: Set<string>;
      }
    >();

    sessions.forEach(session => {
      if (!session.teacher) return;

      if (!teachersMap.has(session.teacher.id)) {
        teachersMap.set(session.teacher.id, {
          teacherId: session.teacher.id,
          teacherName: session.teacher.name,
          classes: new Set(),
          subjects: new Set(),
        });
      }

      const entry = teachersMap.get(session.teacher.id)!;
      entry.classes.add(session.schedule.class.name);
      entry.subjects.add(session.subject.name);
    });

    // تحويل الـ Map إلى مصفوفة مع تحويل الـ Sets إلى Arrays
    const result = Array.from(teachersMap.values()).map(t => ({
      teacherId: t.teacherId,
      teacherName: t.teacherName,
      classes: Array.from(t.classes),
      subjects: Array.from(t.subjects),
    }));

    return NextResponse.json({ teachers: result });
  } catch (error) {
    console.error('Error fetching teachers schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch teachers schedule' }, { status: 500 });
  }
}
