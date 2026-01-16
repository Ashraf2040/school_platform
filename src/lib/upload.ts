export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  // اختيار رابط الرفع بناءً على متغير البيئة أو الافتراضي للـ localhost
  const API_UPLOAD_URL = process.env.NEXT_PUBLIC_API_UPLOAD_URL || "http://localhost:3000";
  
  // تأكد من إضافة "/upload" للنهاية بدون تكرار
  const uploadEndpoint = API_UPLOAD_URL.endsWith('/upload') ? API_UPLOAD_URL : `${API_UPLOAD_URL}/upload`;

  const res = await fetch(uploadEndpoint, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  const data = await res.json();
  return data.url;
}
