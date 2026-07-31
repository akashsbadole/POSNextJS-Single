import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireAuth, unauthorized } from "@/lib/api-auth";

const licenseSchema = z.object({
  licenseType: z.string().min(1),
  licenseNumber: z.string().min(1),
  holderName: z.string().min(1),
  holderType: z.string().min(1),
  holderId: z.string().min(1),
  issuingAuthority: z.string().optional(),
  issueDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime(),
});

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const holderType = searchParams.get("holderType");

    const where: Record<string, unknown> = {};
    if (holderType) where.holderType = holderType;

    const licenses = await prisma.drugLicense.findMany({
      where,
      orderBy: { expiryDate: "asc" },
    });

    return NextResponse.json(licenses);
  } catch (error) {
    console.error("Error fetching drug licenses:", error);
    return NextResponse.json({ error: "Failed to fetch drug licenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const validated = licenseSchema.parse(body);
    const license = await prisma.drugLicense.create({ data: validated });
    return NextResponse.json(license, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("Error creating drug license:", error);
    return NextResponse.json({ error: "Failed to create drug license" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "License ID required" }, { status: 400 });
    const license = await prisma.drugLicense.update({ where: { id }, data });
    return NextResponse.json(license);
  } catch (error) {
    console.error("Error updating drug license:", error);
    return NextResponse.json({ error: "Failed to update drug license" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "License ID required" }, { status: 400 });
    await prisma.drugLicense.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting drug license:", error);
    return NextResponse.json({ error: "Failed to delete drug license" }, { status: 500 });
  }
}
