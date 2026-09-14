import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Login diperlukan." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") || "uploads").replace(/[^a-z0-9_-]/gi, "-");
  if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File gambar tidak valid atau lebih dari 10MB." }, { status: 400 });
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: `tegal-eats/${folder}`, resource_type: "image" }, (error, uploaded) => {
      if (error || !uploaded) reject(error || new Error("Cloudinary tidak mengembalikan hasil upload."));
      else resolve(uploaded);
    });
    stream.end(bytes);
  });
  return NextResponse.json({ url: result.secure_url });
}
