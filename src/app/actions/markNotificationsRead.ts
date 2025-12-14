// src/app/actions/markNotificationsRead.ts
"use server";

import { prisma } from "@/lib/prisma"; // adjust path
import { revalidatePath } from "next/cache";

export async function markNotificationsAsRead(notificationIds: string[]) {
  if (notificationIds.length === 0) return;

  await prisma.notification.updateMany({
    where: {
      id: { in: notificationIds },
      read: false,
    },
    data: {
      read: true,
    },
  });

  // Optional: revalidate dashboard paths if needed
  revalidatePath("/dashboard");
}