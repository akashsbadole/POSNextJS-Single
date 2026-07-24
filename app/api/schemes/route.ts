import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
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
  try {
    const body = await req.json();
    const scheme = await prisma.scheme.create({ data: body });
    return NextResponse.json(scheme, { status: 201 });
  } catch (error) {
    console.error("Error creating scheme:", error);
    return NextResponse.json({ error: "Failed to create scheme" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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
