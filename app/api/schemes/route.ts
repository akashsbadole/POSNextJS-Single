import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { enforceFeature } from "@/lib/features";

const schemeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  schemeType: z.enum(["FREE_GOODS", "CASH_DISCOUNT", "COMBO", "BULK_DISCOUNT"]),
  conditions: z.string().optional(),
  rewards: z.string().optional(),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = {};
    if (isActive !== null && isActive !== "") where.isActive = isActive === "true";

    const schemes = await prisma.scheme.findMany({
      where,
      orderBy: { priority: "desc" },
    });

    return NextResponse.json(schemes);
  } catch (error) {
    console.error("Error fetching schemes:", error);
    return NextResponse.json({ error: "Failed to fetch schemes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const validated = schemeSchema.parse(body);
    const scheme = await prisma.scheme.create({ data: validated });
    return NextResponse.json(scheme, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("Error creating scheme:", error);
    return NextResponse.json({ error: "Failed to create scheme" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "Scheme ID required" }, { status: 400 });
    const scheme = await prisma.scheme.update({ where: { id }, data });
    return NextResponse.json(scheme);
  } catch (error) {
    console.error("Error updating scheme:", error);
    return NextResponse.json({ error: "Failed to update scheme" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Scheme ID required" }, { status: 400 });
    await prisma.scheme.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scheme:", error);
    return NextResponse.json({ error: "Failed to delete scheme" }, { status: 500 });
  }
}
