import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, faceDescriptor } = body;

    // Basic validation
    if (!name || !faceDescriptor) {
      return NextResponse.json({ error: "الاسم والوجه مطلوبان" }, { status: 400 });
    }

    // Find user by email (from session)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update User with Face Descriptor and Phone
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        phone,
        faceDescriptor, // Storing the JSON string of the face vector
      },
    });

    return NextResponse.json({ 
      message: "تم تسجيل بياناتك بنجاح", 
      user: updatedUser 
    });

  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء الحفظ" }, { status: 500 });
  }
}