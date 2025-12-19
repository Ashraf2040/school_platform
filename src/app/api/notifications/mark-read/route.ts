import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from ".././../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inquestId } = await req.json();

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id as string,
      inquestId,
      read: false,
    },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}