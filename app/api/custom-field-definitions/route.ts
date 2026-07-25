import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { requireAuth, unauthorized } from "@/lib/api-auth";

const fieldTypes = ["TEXT", "NUMBER", "BOOLEAN", "DATE", "SELECT", "MULTISELECT"] as const;

const definitionSchema = z.object({
  entityType: z.string().min(1).max(30),
  fieldName: z.string().min(1).max(50),
  fieldType: z.enum(fieldTypes),
  options: z.string().optional(),
  isRequired: z.boolean().default(false),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = {};
    if (entityType) where.entityType = entityType;
    if (isActive !== null && isActive !== "") where.isActive = isActive === "true";

    const definitions = await prisma.customFieldDefinition.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { fieldName: "asc" }],
    });

    return NextResponse.json(definitions);
  } catch (error) {
    console.error("Error fetching custom field definitions:", error);
    return NextResponse.json({ error: "Failed to fetch custom field definitions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const validated = definitionSchema.parse(body);

    const definition = await prisma.customFieldDefinition.create({
      data: validated,
    });

    return NextResponse.json(definition, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating custom field definition:", error);
    return NextResponse.json({ error: "Failed to create custom field definition" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Definition ID is required" }, { status: 400 });
    }

    const existing = await prisma.customFieldDefinition.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Custom field definition not found" }, { status: 404 });
    }

    const parsed = definitionSchema.partial().parse(data);

    const definition = await prisma.customFieldDefinition.update({
      where: { id },
      data: parsed,
    });

    return NextResponse.json(definition);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating custom field definition:", error);
    return NextResponse.json({ error: "Failed to update custom field definition" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Definition ID is required" }, { status: 400 });
    }

    const existing = await prisma.customFieldDefinition.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Custom field definition not found" }, { status: 404 });
    }

    await prisma.customFieldDefinition.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting custom field definition:", error);
    return NextResponse.json({ error: "Failed to delete custom field definition" }, { status: 500 });
  }
}
