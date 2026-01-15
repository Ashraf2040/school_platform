// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";

let put: any;

// نعمل import للـ blob بس على Vercel
if (process.env.VERCEL) {
  // lazy import
  put = (await import("@vercel/blob")).put;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    // ✅ type validation
    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      );
    }

    // ✅ size limit (مثال 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large" },
        { status: 413 }
      );
    }

    const safeName = file.name.replace(/\s+/g, "_");
    const filename = `${uuidv4()}-${safeName}`;

    /* =======================
       🖥️ LOCAL ENVIRONMENT
    ======================= */
    if (!process.env.VERCEL) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadDir = path.join(process.cwd(), "public/uploads");

      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, filename), buffer);

      return NextResponse.json({
        url: `/uploads/${filename}`,
      });
    }

    /* =======================
       ☁️ VERCEL ENVIRONMENT
    ======================= */
    const blob = await put(`uploads/${filename}`, file, {
      access: "public",
    });

    return NextResponse.json({ url: blob.url });

  }  catch (error: any) {
    console.error("UPLOAD ERROR DETAIL:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
