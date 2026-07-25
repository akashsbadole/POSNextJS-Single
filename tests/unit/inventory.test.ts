import { pickBatchFEFO } from "@/lib/inventory";
import { prismaMock } from "../setup/mocks/prisma";

const mockBatches = [
  { id: "b1", batchNumber: "BATCH-001", quantity: 50, expiryDate: new Date("2026-08-01"), medicineId: "m1" },
  { id: "b2", batchNumber: "BATCH-002", quantity: 30, expiryDate: new Date("2026-09-01"), medicineId: "m1" },
  { id: "b3", batchNumber: "BATCH-003", quantity: 20, expiryDate: new Date("2026-10-01"), medicineId: "m1" },
];

describe("pickBatchFEFO", () => {
  it("picks oldest batch first", async () => {
    prismaMock.batch.findMany.mockResolvedValue(mockBatches);
    const picks = await pickBatchFEFO("m1", "branch-1", 40);
    expect(picks).toHaveLength(1);
    expect(picks[0].batchNumber).toBe("BATCH-001");
    expect(picks[0].pickQty).toBe(40);
  });

  it("spreads across multiple batches", async () => {
    prismaMock.batch.findMany.mockResolvedValue(mockBatches);
    const picks = await pickBatchFEFO("m1", "branch-1", 90);
    expect(picks).toHaveLength(3);
    expect(picks[0].pickQty).toBe(50);
    expect(picks[1].pickQty).toBe(30);
    expect(picks[2].pickQty).toBe(10);
  });

  it("throws on insufficient stock", async () => {
    prismaMock.batch.findMany.mockResolvedValue(mockBatches);
    await expect(pickBatchFEFO("m1", "branch-1", 999)).rejects.toThrow("Insufficient stock");
  });

  it("returns empty array when no batches exist", async () => {
    prismaMock.batch.findMany.mockResolvedValue([]);
    await expect(pickBatchFEFO("m1", "branch-1", 10)).rejects.toThrow("Insufficient stock");
  });
});
