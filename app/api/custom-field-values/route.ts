import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json({ error: "entityType and entityId required" }, { status: 400 });
    }

    const values = await prisma.customFieldValue.findMany({
      where: { entityType, entityId },
      include: { field: true },
    });

    const mapped: Record<string, string> = {};
    values.forEach((v) => { mapped[v.field.fieldName] = v.value; });

    return NextResponse.json({ values, mapped });
  } catch (error) {
    console.error("Error fetching custom field values:", error);
    return NextResponse.json({ error: "Failed to fetch values" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { entityType, entityId, values } = body;

    if (!entityType || !entityId || !values) {
      return NextResponse.json({ error: "entityType, entityId, values required" }, { status: 400 });
    }

    const results = [];
    for (const [fieldName, value] of Object.entries(values)) {
      const field = await prisma.customFieldDefinition.findUnique({
        where: { entityType_fieldName: { entityType, fieldName } },
      });
      if (!field) continue;

      const v = await prisma.customFieldValue.upsert({
        where: { entityType_entityId_fieldId: { entityType, entityId, fieldId: field.id } },
        update: { value: String(value) },
        create: { entityType, entityId, fieldId: field.id, value: String(value) },
      });
      results.push(v);
    }

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    console.error("Error saving custom field values:", error);
    return NextResponse.json({ error: "Failed to save values" }, { status: 500 });
  }
}
