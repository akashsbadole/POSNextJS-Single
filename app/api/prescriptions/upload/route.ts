import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";

// magic bytes per allowed extension — an HTML file renamed to .jpg must not reach /public
const MAGIC: Record<string, (b: Buffer) => boolean> = {
  ".jpg": (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  ".jpeg": (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  ".png": (b) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  ".webp": (b) => b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP",
  ".pdf": (b) => b.length > 4 && b.toString("ascii", 0, 4) === "%PDF",
};

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    if (!(await checkRateLimit(`upload:${session.user.id}`, 20, 60 * 60 * 1000))) {
      return NextResponse.json({ error: "Too many uploads, try later" }, { status: 429 });
    }

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
    const sniff = MAGIC[ext];
    if (!sniff(buffer)) {
      return NextResponse.json({ error: "File content does not match its extension" }, { status: 400 });
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
