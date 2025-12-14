// src/app/actions/announcements.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function markAnnouncementAsRead(recipientId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") {
    return;
  }

  await prisma.announcementRecipient.update({
    where: { id: recipientId },
    data: { read: true, readAt: new Date() },
  });
}
