import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/utils";
import { postJournal } from "@/lib/accounting";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const where: Record<string, unknown> = {};
    if (session.user.branchId && session.user.role !== "OWNER") {
      where.branchId = session.user.branchId;
    }

    const [returns, total] = await Promise.all([
      prisma.purchaseReturn.findMany({
        where,
        include: {
          supplier: true,
          po: { select: { poNumber: true } },
          createdBy: { select: { name: true } },
          items: { include: { medicine: { select: { name: true } } } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.purchaseReturn.count({ where }),
    ]);

    return NextResponse.json({ returns, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Error fetching purchase returns:", error);
    return NextResponse.json({ error: "Failed to fetch purchase returns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { branchId, poId, reason, items } = body;
    if (!branchId || !poId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "branchId, poId and items are required" }, { status: 400 });
    }
    if (items.some((i: { quantity?: number }) => !Number.isInteger(i.quantity) || (i.quantity ?? 0) <= 0)) {
      return NextResponse.json({ error: "Item quantities must be positive integers" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true },
      });
      if (!po) throw new Error("Purchase order not found");
      if (po.branchId !== branchId) throw new Error("PO belongs to another branch");
      if (po.status === "DRAFT") throw new Error("PO not received yet");

      const poItems = new Map(po.items.map((i) => [i.medicineId, i]));
      const prevReturned = new Map<string, number>();
      const prevRows = await tx.purchaseReturnItem.findMany({
        where: { return: { poId } },
        select: { medicineId: true, quantity: true },
      });
      for (const row of prevRows) {
        prevReturned.set(row.medicineId, (prevReturned.get(row.medicineId) || 0) + row.quantity);
      }

      const returnItems: { medicineId: string; batchId?: string; quantity: number; unitPrice: number; gstRate: number; totalAmount: number }[] = [];
      let subtotal = 0;

      for (const item of items) {
        const line = poItems.get(item.medicineId);
        if (!line) throw new Error(`Medicine not in PO: ${item.medicineId}`);
        const already = prevReturned.get(item.medicineId) || 0;
        if (item.quantity > line.receivedQty - already) {
          throw new Error(`Cannot return more than received (medicine ${item.medicineId})`);
        }

        let batchId = item.batchId;
        if (batchId) {
          const batch = await tx.batch.findUnique({ where: { id: batchId } });
          if (!batch || batch.medicineId !== item.medicineId || batch.quantity < item.quantity) {
            throw new Error("Batch not found or insufficient batch stock");
          }
        } else {
          // ponytail: no batch given -> return from the most recently received batch with enough stock
          const latest = await tx.batch.findFirst({
            where: { medicineId: item.medicineId, quantity: { gte: item.quantity } },
            orderBy: { createdAt: "desc" },
          });
          if (!latest) throw new Error(`No batch with enough stock for medicine ${item.medicineId}`);
          batchId = latest.id;
        }

        const totalAmount = item.quantity * line.unitPrice;
        subtotal += totalAmount;
        returnItems.push({
          medicineId: item.medicineId,
          batchId,
          quantity: item.quantity,
          unitPrice: line.unitPrice,
          gstRate: line.gstRate,
          totalAmount,
        });
      }

      const gstTotal = returnItems.reduce((s, i) => s + (i.totalAmount * i.gstRate) / 100, 0);

      const created = await tx.purchaseReturn.create({
        data: {
          returnNumber: await generateInvoiceNumber("PRET"),
          poId,
          branchId,
          supplierId: po.supplierId,
          reason: reason || null,
          subtotal,
          cgstAmount: gstTotal / 2,
          sgstAmount: gstTotal / 2,
          totalGst: gstTotal,
          totalAmount: subtotal + gstTotal,
          status: "COMPLETED",
          createdById: session.user.id,
          items: { create: returnItems },
        },
        include: { items: true },
      });

      for (const item of returnItems) {
        await tx.inventory.update({
          where: { medicineId_branchId: { medicineId: item.medicineId, branchId } },
          data: { quantity: { decrement: item.quantity } },
        });
        await tx.batch.update({
          where: { id: item.batchId! },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE",
          entityType: "purchase_return",
          entityId: created.id,
          newData: JSON.stringify({ returnNumber: created.returnNumber, items: returnItems }),
        },
      });

      await postJournal(tx, {
        memo: `Purchase return ${created.returnNumber}`,
        referenceType: "purchase_return",
        referenceId: created.id,
        createdById: session.user.id,
        lines: [
          { accountCode: "2010", debit: Math.round((subtotal + gstTotal) * 100) / 100 },
          { accountCode: "1200", credit: Math.round(subtotal * 100) / 100 },
          { accountCode: "2040", credit: Math.round((gstTotal / 2) * 100) / 100 },
          { accountCode: "2050", credit: Math.round((gstTotal / 2) * 100) / 100 },
        ],
      });

      return created;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create purchase return";
    const status = message.startsWith("Purchase order not found") ? 404
      : message.startsWith("PO belongs") ? 400
      : message.startsWith("PO not received") ? 400
      : message.startsWith("Medicine not in PO") ? 400
      : message.startsWith("Cannot return more") ? 400
      : message.startsWith("Batch not found") || message.startsWith("No batch") ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
