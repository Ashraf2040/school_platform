// src/app/actions/createAnnouncement.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { uploadFile } from "@/lib/upload";

export type AnnouncementFormState = {
  message: string;
  success: boolean;
};

export async function createAnnouncement(
  prevState: AnnouncementFormState,
  formData: FormData
): Promise<AnnouncementFormState> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return { message: "Not authorized", success: false };
  }

  try {
    const title = formData.get("title") as string;
    const body = formData.get("body") as string;
    const date = new Date(formData.get("date") as string);

    const rawType = formData.get("type");
    console.log("RAW TYPE FROM FORM:", rawType); // ← see what actually arrives

    // Default to GENERAL if anything is missing/empty
    let typeEnum: "GENERAL" | "TARGETED" = "GENERAL";
    if (rawType === "targeted") typeEnum = "TARGETED";

    const teacherIdsRaw = formData.getAll("teacherIds");
    const teacherIds = teacherIdsRaw.map((id) => id as string);

    let attachmentUrl: string | null = null;
    const file = formData.get("attachment") as File | null;
    if (file && file.size > 0) {
      attachmentUrl = await uploadFile(file);
    }

    await prisma.announcement.create({
      data: {
        title,
        body,
        date,
        attachmentUrl,
        type: typeEnum,
        createdById: session.user.id,
        recipients: {
          create:
            typeEnum === "GENERAL"
              ? (
                  await prisma.user.findMany({
                    where: { role: "TEACHER" },
                    select: { id: true },
                  })
                ).map((t) => ({ teacherId: t.id }))
              : teacherIds.map((id) => ({ teacherId: id })),
        },
      },
    });

    return { message: "", success: true };
  } catch (err) {
    console.error(err);
    return { message: "Failed to create announcement", success: false };
  }
}
