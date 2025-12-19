// app/api/lessons/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';


export const runtime = 'nodejs';



export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date') ?? '';

  if (!dateStr) {
    return NextResponse.json({ error: 'date is required' }, { status: 400 });
  }

  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(`${dateStr}T23:59:59.999Z`);

  const lessons = await prisma.lesson.findMany({
    where: {
      teacherId: session.user.id,
      date: { gte: start, lte: end },
      subject: {
        teachers: {
          some: {
            teacherId: session.user.id  // ← Fixed: use teacherId, not id
          }
        }
      },
    },
    include: { class: true, subject: true },
    orderBy: [{ date: 'asc' }, { id: 'asc' }],
  });

  return NextResponse.json(lessons, { status: 200 });
}