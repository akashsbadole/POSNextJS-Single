import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");

    const where = entityType ? { entityType } : {};
    const fields = await prisma.customFieldDefinition.findMany({
      where,
      orderBy: [{ entityType: "asc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json({ fields });
  } catch {
    return NextResponse.json({ error: "Failed to fetch custom fields" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { entityType, fieldName, fieldType, options, isRequired, placeholder, sortOrder } = body;

    if (!entityType || !fieldName || !fieldType) {
      return NextResponse.json({ error: "entityType, fieldName, fieldType required" }, { status: 400 });
    }

    const field = await prisma.customFieldDefinition.create({
      data: {
        entityType,
        fieldName,
        fieldType,
        options: options ? JSON.stringify(options) : null,
        isRequired: isRequired || false,
        placeholder,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json(field, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Field already exists for this entity type" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create custom field" }, { status: 500 });
  }
}
