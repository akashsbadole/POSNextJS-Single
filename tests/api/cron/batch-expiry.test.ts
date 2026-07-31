import { GET } from "@/app/api/cron/batch-expiry/route";
import { prismaMock } from "../../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../../helpers";

describe("Batch Expiry Cron API", () => {
  beforeEach(() => { jest.clearAllMocks(); process.env.CRON_SECRET = "cron-secret"; });
  function cronRequest(url: string) {
    const req = createRequest(url);
    req.headers.set("x-cron-secret", "cron-secret");
    return req;
  }

  it("creates notifications for expiring batches", async () => {
    prismaMock.batch.findMany.mockResolvedValue([
      { id: "b1", batchNumber: "B-001", expiryDate: new Date("2026-08-01"), quantity: 50, medicine: { name: "Paracetamol" }, inventory: { branchId: "br1" } },
    ] as never);
    prismaMock.notification.findMany.mockResolvedValue([] as never);
    prismaMock.user.findMany.mockResolvedValue([{ id: "u1" }, { id: "u2" }] as never);
    prismaMock.notification.createMany.mockResolvedValue({ count: 2 } as never);

    const { json } = await expectJson(GET, cronRequest("/api/cron/batch-expiry?days=30"));
    expect(json.created).toBe(2);
    expect(json.totalExpiring).toBe(1);
  });

  it("returns zero created when no batches expiring", async () => {
    prismaMock.batch.findMany.mockResolvedValue([] as never);
    const { json } = await expectJson(GET, cronRequest("/api/cron/batch-expiry"));
    expect(json.created).toBe(0);
    expect(json.totalExpiring).toBe(0);
  });

  it("rejects requests without a valid secret", async () => {
    const req = createRequest("/api/cron/batch-expiry");
    req.headers.set("x-cron-secret", "wrong");
    const { res } = await expectStatus(GET, req, 403);
  });
});
