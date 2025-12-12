import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// Removed: import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, password, action } = body;

  if (action === "validate" && token) {
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token: token, // plain comparison
        expires: { gt: new Date() },
      },
    });
    return resetToken ? NextResponse.json({ valid: true }) : NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  if (!token || !password) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  try {
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token: token, // plain comparison
        expires: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    // Store new password in plain text
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: password },
    });

    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}