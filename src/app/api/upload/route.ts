import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    // 1. التحقق من وجود الملف وأنه object
    if (!file || typeof file !== "object") {
      return NextResponse.json({ error: "No valid file provided" }, { status: 400 });
    }

    // 2. التأكد من خصائص الملف
    const fileObj = file as any;
    if (!fileObj.name || fileObj.size === undefined) {
      return NextResponse.json({ error: "Invalid file structure" }, { status: 400 });
    }

    // 3. التحقق من نوع الملف (PDF أو صورة فقط)
    const isPdf = fileObj.type === "application/pdf";
    const isImage = fileObj.type?.startsWith("image/");
    if (!isPdf && !isImage) {
      return NextResponse.json(
        {
          error: `Invalid file type (${fileObj.type}). Only PDF and Images are allowed.`,
        },
        { status: 400 }
      );
    }

    // 4. تحويل الملف إلى Buffer
    const buffer = Buffer.from(await fileObj.arrayBuffer());

    // 5. إنشاء اسم فريد للملف مع الامتداد الأصلي
    const filename = `${uuidv4()}${path.extname(fileObj.name)}`;

    // 6. تحديد مسار المجلد الذي سيخزن فيه الملفات
    const uploadDir = path.join(process.cwd(), "public/uploads");

    // 7. إنشاء المجلد إذا لم يكن موجودًا
    await fs.mkdir(uploadDir, { recursive: true });

    // 8. كتابة الملف في المجلد
    await fs.writeFile(path.join(uploadDir, filename), buffer);

    // 9. إعادة رابط الملف للعميل
    const url = `/uploads/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to save file" }, { status: 500 });
  }
}
