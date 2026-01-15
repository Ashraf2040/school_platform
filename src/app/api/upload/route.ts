// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file"); 

  // 1. FIX: Check if file exists and is an object
  // We use 'object' because Next.js File objects are not instanceof global File
  if (!file || typeof file !== 'object') {
    return NextResponse.json({ error: "No valid file provided" }, { status: 400 });
  }

  // 2. Explicitly check properties to ensure it is a file-like object
  const fileObj = file as any;
  if (!fileObj.name || fileObj.size === undefined) {
     return NextResponse.json({ error: "Invalid file structure" }, { status: 400 });
  }

  // 3. Validation: Allow PDF OR Images
  const isPdf = fileObj.type === "application/pdf";
  const isImage = fileObj.type?.startsWith("image/");

  if (!isPdf && !isImage) {
    return NextResponse.json(
      { 
        error: `Invalid file type (${fileObj.type}). Only PDF and Images are allowed.` 
      }, 
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await fileObj.arrayBuffer());
    const filename = `${uuidv4()}${path.extname(fileObj.name)}`;
    const uploadDir = path.join(process.cwd(), "public/uploads");
    
    // Create directory if it doesn't exist
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Write file
    await fs.writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to save file" }, { status: 500 });
  }
}