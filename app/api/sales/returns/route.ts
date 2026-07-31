import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/utils";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const where: Record<string, unknown> = {};
    // ponytail: mirror sales GET scoping — non-OWNER sees only their branch
    if (session.user.branchId && session.user.role !== "OWNER") {
      where.sale = { branchId: session.user.branchId };
    }

    const [returns, total] = await Promise.all([
      prisma.saleReturn.findMany({
        where,
        include: {
          sale: { select: { invoiceNumber: true } },
          items: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.saleReturn.count({ where }),
    ]);

    return NextResponse.json({ returns, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Error fetching returns:", error);
    return NextResponse.json({ error: "Failed to fetch returns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { items, saleId, reason, branchId } = body;
    if (!saleId || !Array.isArray(items) || items.length === 0 || !branchId) {
      return NextResponse.json({ error: "saleId, branchId and items are required" }, { status: 400 });
    }
    if (body.refundMode && !["CASH", "UPI", "CARD", "BANK_TRANSFER"].includes(body.refundMode)) {
      return NextResponse.json({ error: "Invalid refund mode" }, { status: 400 });
    }

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true },
    });
    if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    if (sale.branchId !== branchId) {
      return NextResponse.json({ error: "Return must be processed at the sale's branch" }, { status: 400 });
    }

    // only return items that were actually on the sale, not more than was sold, and never a unit twice
    const soldMap = new Map(sale.items.map((i) => [i.medicineId, i]));
    const previouslyReturned = await prisma.saleReturnItem.groupBy({
      by: ["medicineId"],
      where: { return: { saleId } },
      _sum: { quantity: true },
    });
    const remaining = new Map(
      sale.items.map((i) => [i.medicineId, i.quantity - (previouslyReturned.find((r) => r.medicineId === i.medicineId)?._sum.quantity ?? 0)])
    );
    for (const item of items) {
      if (!soldMap.has(item.medicineId)) {
        return NextResponse.json({ error: `Medicine ${item.medicineId} was not on this sale` }, { status: 400 });
      }
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        return NextResponse.json({ error: "Return quantity must be a positive integer" }, { status: 400 });
      }
      const left = remaining.get(item.medicineId) ?? 0;
      if (qty > left) {
        return NextResponse.json({ error: `Return quantity exceeds the remaining sold quantity for this line` }, { status: 400 });
      }
      remaining.set(item.medicineId, left - qty);
    }

    const saleReturn = await prisma.$transaction(async (tx) => {
      const itemsData = items.map((item: { medicineId: string; quantity: number }) => {
        const line = soldMap.get(item.medicineId)!;
        const qty = Number(item.quantity);
        return {
          medicineId: item.medicineId,
          quantity: qty,
          unitPrice: line.unitPrice, // server price — never trust the client
          refundAmount: Math.round(line.unitPrice * qty * 100) / 100,
          reason,
        };
      });
      const refundAmount = itemsData.reduce((sum: number, i: { refundAmount: number }) => sum + i.refundAmount, 0);

      const ret = await tx.saleReturn.create({
        data: {
          saleId,
          reason,
          refundAmount,
          refundMode: body.refundMode || "CASH",
          returnNumber: await generateInvoiceNumber("RMA"),
          items: {
            create: itemsData,
          },
        },
        include: { items: true },
      });

      for (const item of items) {
        const line = soldMap.get(item.medicineId)!;
        const qty = Number(item.quantity);
        const inventory = await tx.inventory.upsert({
          where: { medicineId_branchId: { medicineId: item.medicineId, branchId } },
          update: { quantity: { increment: qty } },
          create: { medicineId: item.medicineId, branchId, quantity: qty },
        });
        // restock into the batch the goods were picked from; fall back to the earliest-expiring batch
        const batch = await tx.batch.findFirst({
          where: {
            medicineId: item.medicineId,
            inventoryId: inventory.id,
            ...(line.batchNumber ? { batchNumber: line.batchNumber } : {}),
          },
          orderBy: { expiryDate: "asc" },
        });
        if (batch) {
          await tx.batch.update({ where: { id: batch.id }, data: { quantity: { increment: qty } } });
        }
        // ponytail: no matching batch row (legacy data) — stock restored at inventory level only, FEFO will ignore it
      }

      return ret;
    });

    return NextResponse.json(saleReturn, { status: 201 });
  } catch (error) {
    console.error("Error creating return:", error);
    return NextResponse.json({ error: "Failed to create return" }, { status: 500 });
  }
}
