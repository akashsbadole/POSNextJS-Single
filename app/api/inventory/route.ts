import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { z } from "zod";

const inventorySchema = z.object({
  medicineId: z.string().min(1),
  branchId: z.string().min(1),
  quantity: z.number().int().min(0).default(0),
});

const inventoryUpdateSchema = z.object({
  quantity: z.number().int().min(0).optional(),
  reorderLevel: z.number().int().min(0).optional(),
});

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const lowStock = searchParams.get("lowStock") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const where: Record<string, unknown> = {};
    if (branchId) where.branchId = branchId;

    let inventory: Awaited<ReturnType<typeof prisma.inventory.findMany>>;
    let total: number;
    const include = {
      medicine: { include: { category: true, supplier: true } },
      branch: true,
      batches: { orderBy: { expiryDate: "asc" } },
    } as const;
    if (lowStock) {
      // ponytail: cross-column compare (quantity vs medicine.reorderLevel) needs JS; capped at 1000 rows
      const all = await prisma.inventory.findMany({ where, include, take: 1000 });
      const low = all.filter((i) => i.quantity <= (i.medicine.reorderLevel ?? 10));
      total = low.length;
      inventory = low.slice((page - 1) * limit, page * limit);
    } else {
      [inventory, total] = await Promise.all([
        prisma.inventory.findMany({
          where,
          include,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { updatedAt: "desc" },
        }),
        prisma.inventory.count({ where }),
      ]);
    }

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
    const validated = inventorySchema.parse(body);
    const item = await prisma.inventory.create({ data: validated });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("Error creating inventory:", error);
    return NextResponse.json({ error: "Failed to create inventory" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { id, reason, ...data } = body;
    if (!id) return NextResponse.json({ error: "Inventory ID required" }, { status: 400 });
    const validated = inventoryUpdateSchema.parse(data);
    const before = validated.quantity !== undefined
      ? await prisma.inventory.findUnique({ where: { id }, include: { medicine: true } })
      : null;
    const item = await prisma.inventory.update({ where: { id }, data: validated });
    // ponytail: reuse auditLog as the adjustment ledger — no new model, no migration
    if (validated.quantity !== undefined && before) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "ADJUST",
          entityType: "inventory",
          entityId: id,
          newData: JSON.stringify({
            medicine: before.medicine.name,
            branchId: before.branchId,
            from: before.quantity,
            to: item.quantity,
            change: item.quantity - before.quantity,
            reason: reason || null,
          }),
        },
      });
    }
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("Error updating inventory:", error);
    return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
  }
}
