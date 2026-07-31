import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // images only — svg/html uploads would be served from /public and execute scripts
    const ext = path.extname(file.name).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp", ".pdf"].includes(ext)) {
      return NextResponse.json({ error: "Only JPG, PNG, WEBP or PDF files are allowed" }, { status: 400 });
    }
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const filename = `${randomUUID()}${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", "prescriptions");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);

    const ocrText = formData.get("ocrText") as string | null;
    if (ocrText) {
      await writeFile(path.join(dir, `${filename}.txt`), ocrText);
    }

    return NextResponse.json({
      url: `/uploads/prescriptions/${filename}`,
      ocrText,
    });
  } catch (error) {
    console.error("Error uploading prescription:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// ponytail: local fs storage. Upgrade to S3/R2 when multi-server or backup needs arise.
