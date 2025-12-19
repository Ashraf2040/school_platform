// src/app/api/users/[id]/classes/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }  // ← params is now a Promise
) {
  const params = await context.params;  // ← await it
  const id = params.id;

  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        classesTaught: {
          select: {
            class: {
              select: { id: true, name: true },
            },
          },
          orderBy: { class: { name: "asc" } },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const classes = user.classesTaught.map((ct) => ct.class);
    return NextResponse.json(classes);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }
}