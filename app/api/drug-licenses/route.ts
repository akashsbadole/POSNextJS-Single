import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
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
  try {
    const body = await req.json();
    const license = await prisma.drugLicense.create({ data: body });
    return NextResponse.json(license, { status: 201 });
  } catch (error) {
    console.error("Error creating drug license:", error);
    return NextResponse.json({ error: "Failed to create drug license" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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
