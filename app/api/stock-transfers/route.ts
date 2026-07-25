import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/utils";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const transfers = await prisma.stockTransfer.findMany({
      where,
      include: {
        fromBranch: { select: { name: true } },
        toBranch: { select: { name: true } },
        items: { include: { medicine: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ transfers });
  } catch (error) {
    console.error("Error fetching stock transfers:", error);
    return NextResponse.json({ error: "Failed to fetch transfers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { fromBranchId, toBranchId, items, notes } = body;

    if (!fromBranchId || !toBranchId || !items?.length) {
      return NextResponse.json({ error: "fromBranchId, toBranchId, and items are required" }, { status: 400 });
    }

    if (fromBranchId === toBranchId) {
      return NextResponse.json({ error: "Source and destination branches must differ" }, { status: 400 });
    }

    const transfer = await prisma.stockTransfer.create({
      data: {
        transferNumber: await generateInvoiceNumber("ST"),
        fromBranchId,
        toBranchId,
        notes,
        status: "PENDING",
        items: {
          create: items.map((it: { medicineId: string; quantity: number; batchNumber?: string }) => ({
            medicineId: it.medicineId,
            quantity: it.quantity,
            batchNumber: it.batchNumber,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    console.error("Error creating stock transfer:", error);
    return NextResponse.json({ error: "Failed to create transfer" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }

    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!transfer) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
    }

    if (transfer.status !== "PENDING") {
      return NextResponse.json({ error: `Cannot update transfer with status ${transfer.status}` }, { status: 400 });
    }

    if (status === "APPROVED") {
      await prisma.$transaction(async (tx) => {
        for (const item of transfer.items) {
          const fromInventory = await tx.inventory.findFirst({
            where: { medicineId: item.medicineId, branchId: transfer.fromBranchId },
          });

          if (!fromInventory || fromInventory.quantity < item.quantity) {
            throw new Error(`Insufficient stock for ${item.medicineId}`);
          }

          await tx.inventory.update({
            where: { id: fromInventory.id },
            data: { quantity: { decrement: item.quantity } },
          });

          await tx.inventory.upsert({
            where: {
              medicineId_branchId: { medicineId: item.medicineId, branchId: transfer.toBranchId },
            },
            update: { quantity: { increment: item.quantity } },
            create: {
              medicineId: item.medicineId,
              branchId: transfer.toBranchId,
              quantity: item.quantity,
            },
          });
        }
      });
    }

    const updated = await prisma.stockTransfer.update({
      where: { id },
      data: { status },
      include: { items: { include: { medicine: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating stock transfer:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update transfer" }, { status: 500 });
  }
}
