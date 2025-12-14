// src/lib/upload.ts
"use server";

import { supabase } from "./supabaseServer";

const BUCKET_NAME = "attachments"; // change to your bucket name in Supabase

export async function uploadFile(file: File): Promise<string> {
  // Create a unique path: attachments/<timestamp>-<random>.<ext>
  const ext = file.name.split(".").pop() ?? "bin";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `announcements/${fileName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file);

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // For a public bucket, get a public URL to store in DB
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

  return publicUrl; // this matches your `attachmentUrl = await uploadFile(file);`
}
