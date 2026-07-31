import { prisma } from "@/lib/db";

export type BatchPick = {
  batchId: string;
  batchNumber: string;
  pickQty: number;
  remainingQty: number;
};

type TxClient = {
  batch: {
    findMany: (args: Record<string, unknown>) => Promise<{ id: string; batchNumber: string; quantity: number; expiryDate: Date }[]>;
  };
};

export async function pickBatchFEFO(medicineId: string, branchId: string, qty: number, tx?: TxClient): Promise<BatchPick[]> {
  const client = tx || prisma;
  const batches = await client.batch.findMany({
    where: {
      medicineId,
      inventory: { branchId },
      quantity: { gt: 0 },
      expiryDate: { gt: new Date() },
    },
    orderBy: { expiryDate: "asc" },
  });

  const picks: BatchPick[] = [];
  let remaining = qty;

  for (const batch of batches) {
    if (remaining <= 0) break;
    const pickQty = Math.min(batch.quantity, remaining);
    picks.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      pickQty,
      remainingQty: batch.quantity - pickQty,
    });
    remaining -= pickQty;
  }

  if (remaining > 0) {
    throw new Error(`Insufficient stock across batches. Requested ${qty}, available ${qty - remaining}`);
  }

  return picks;
}
