import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const lowStock = searchParams.get("lowStock") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (branchId) where.branchId = branchId;
    if (lowStock) {
      where.quantity = { lte: 10 };
    }

    const [inventory, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          medicine: { include: { category: true, supplier: true } },
          branch: true,
          batches: { orderBy: { expiryDate: "asc" } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.inventory.count({ where }),
    ]);

    return NextResponse.json({ inventory, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const item = await prisma.inventory.create({ data: body });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating inventory:", error);
    return NextResponse.json({ error: "Failed to create inventory" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "Inventory ID required" }, { status: 400 });
    const item = await prisma.inventory.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Error updating inventory:", error);
    return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
  }
}
