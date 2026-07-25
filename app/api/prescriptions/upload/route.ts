import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const config = {
  api: { bodyParser: false },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || ".jpg";
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(process.cwd(), "public", "uploads", "prescriptions", filename);

    await writeFile(filepath, buffer);

    return NextResponse.json({ url: `/uploads/prescriptions/${filename}` });
  } catch (error) {
    console.error("Error uploading prescription:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
