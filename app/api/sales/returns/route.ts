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

    const [returns, total] = await Promise.all([
      prisma.saleReturn.findMany({
        include: {
          sale: { select: { invoiceNumber: true } },
          items: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.saleReturn.count(),
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

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true },
    });
    if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

    // only return items that were actually on the sale, and not more than was sold
    const soldMap = new Map(sale.items.map((i) => [i.medicineId, i.quantity]));
    for (const item of items) {
      const soldQty = soldMap.get(item.medicineId);
      if (!soldQty) return NextResponse.json({ error: `Medicine ${item.medicineId} was not on this sale` }, { status: 400 });
      if (item.quantity <= 0 || item.quantity > soldQty) {
        return NextResponse.json({ error: `Return quantity exceeds sold quantity for ${item.medicineId}` }, { status: 400 });
      }
    }

    const saleReturn = await prisma.$transaction(async (tx) => {
      const itemsData = items.map((item: { medicineId: string; quantity: number; unitPrice?: number }) => ({
        medicineId: item.medicineId,
        quantity: item.quantity,
        unitPrice: item.unitPrice ?? 0,
        refundAmount: (item.unitPrice ?? 0) * item.quantity,
        reason,
      }));
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
        await tx.inventory.updateMany({
          where: { medicineId: item.medicineId, branchId },
          data: { quantity: { increment: item.quantity } },
        });
      }

      return ret;
    });

    return NextResponse.json(saleReturn, { status: 201 });
  } catch (error) {
    console.error("Error creating return:", error);
    return NextResponse.json({ error: "Failed to create return" }, { status: 500 });
  }
}
