import { GET } from "@/app/api/cron/batch-expiry/route";
import { prismaMock } from "../../setup/mocks/prisma";
import { createRequest, expectJson } from "../../helpers";

describe("Batch Expiry Cron API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates notifications for expiring batches", async () => {
    prismaMock.batch.findMany.mockResolvedValue([
      { id: "b1", batchNumber: "B-001", expiryDate: new Date("2026-08-01"), quantity: 50, medicine: { name: "Paracetamol" }, inventory: { branchId: "br1" } },
    ] as never);
    prismaMock.notification.findMany.mockResolvedValue([] as never);
    prismaMock.notification.createMany.mockResolvedValue({ count: 1 } as never);

    const { json } = await expectJson(GET, createRequest("/api/cron/batch-expiry?days=30"));
    expect(json.created).toBe(1);
    expect(json.totalExpiring).toBe(1);
  });

  it("returns zero created when no batches expiring", async () => {
    prismaMock.batch.findMany.mockResolvedValue([] as never);
    const { json } = await expectJson(GET, createRequest("/api/cron/batch-expiry"));
    expect(json.created).toBe(0);
    expect(json.totalExpiring).toBe(0);
  });
});
