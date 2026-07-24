import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    const where: Record<string, unknown> = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const values = await prisma.customFieldValue.findMany({
      where,
      include: { field: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(values);
  } catch (error) {
    console.error("Error fetching custom field values:", error);
    return NextResponse.json({ error: "Failed to fetch custom field values" }, { status: 500 });
  }
}

const valueSchema = z.object({
  entityType: z.string().min(1).max(30),
  entityId: z.string().min(1),
  fieldId: z.string().min(1),
  value: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = valueSchema.parse(body);

    const existing = await prisma.customFieldDefinition.findUnique({
      where: { id: validated.fieldId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Custom field definition not found" }, { status: 404 });
    }

    const value = await prisma.customFieldValue.upsert({
      where: {
        entityType_entityId_fieldId: {
          entityType: validated.entityType,
          entityId: validated.entityId,
          fieldId: validated.fieldId,
        },
      },
      update: { value: validated.value },
      create: validated,
    });

    return NextResponse.json(value, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error saving custom field value:", error);
    return NextResponse.json({ error: "Failed to save custom field value" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, value } = body;

    if (!id || typeof value !== "string") {
      return NextResponse.json({ error: "Value ID and value are required" }, { status: 400 });
    }

    const existing = await prisma.customFieldValue.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Custom field value not found" }, { status: 404 });
    }

    const updated = await prisma.customFieldValue.update({
      where: { id },
      data: { value },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating custom field value:", error);
    return NextResponse.json({ error: "Failed to update custom field value" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Value ID is required" }, { status: 400 });
    }

    const existing = await prisma.customFieldValue.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Custom field value not found" }, { status: 404 });
    }

    await prisma.customFieldValue.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting custom field value:", error);
    return NextResponse.json({ error: "Failed to delete custom field value" }, { status: 500 });
  }
}
