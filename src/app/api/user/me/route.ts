import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { faceDescriptor: true },
    });

    if (!user || !user.faceDescriptor) {
      return NextResponse.json({ error: "No face data found" }, { status: 404 });
    }

    // Parse the JSON string from DB into a number array
    const descriptor = JSON.parse(user.faceDescriptor as string);

    return NextResponse.json({ descriptor });
  } catch (error) {
    console.error("Fetch User Error:", error);
    return NextResponse.json({ error: "Error fetching user" }, { status: 500 });
  }
}