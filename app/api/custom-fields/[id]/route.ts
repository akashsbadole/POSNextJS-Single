import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const id = (await params).id;
    const field = await prisma.customFieldDefinition.findUnique({ where: { id } });
    if (!field) return NextResponse.json({ error: "Field not found" }, { status: 404 });
    return NextResponse.json(field);
  } catch (error) {
    console.error("Error fetching custom field:", error);
    return NextResponse.json({ error: "Failed to fetch field" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const id = (await params).id;
    const body = await req.json();

    const field = await prisma.customFieldDefinition.update({
      where: { id },
      data: {
        ...(body.fieldName !== undefined ? { fieldName: body.fieldName } : {}),
        ...(body.fieldType !== undefined ? { fieldType: body.fieldType } : {}),
        ...(body.options !== undefined ? { options: body.options ? JSON.stringify(body.options) : null } : {}),
        ...(body.isRequired !== undefined ? { isRequired: body.isRequired } : {}),
        ...(body.placeholder !== undefined ? { placeholder: body.placeholder } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
    });

    return NextResponse.json(field);
  } catch (error) {
    console.error("Error updating custom field:", error);
    return NextResponse.json({ error: "Failed to update field" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const id = (await params).id;
    await prisma.customFieldDefinition.delete({ where: { id } });
    await prisma.customFieldValue.deleteMany({ where: { fieldId: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting custom field:", error);
    return NextResponse.json({ error: "Failed to delete field" }, { status: 500 });
  }
}
