import { POST } from "@/app/api/purchases/receive/route";
import { prismaMock } from "../../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../../helpers";

const po = {
  id: "po1",
  poNumber: "PO-001",
  status: "PENDING",
  items: [{ id: "item1", medicineId: "m1", quantity: 10, unitPrice: 20, medicine: { mrp: 25, name: "Paracetamol" } }],
};

describe("Purchase Receive API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("receives goods: upserts inventory and creates a batch", async () => {
    prismaMock.$transaction = jest.fn((fn: (tx: typeof prismaMock) => unknown) => fn(prismaMock)) as never;
    prismaMock.purchaseOrder.findUnique.mockResolvedValue(po as never);
    prismaMock.purchaseOrder.update.mockResolvedValue({} as never);
    prismaMock.inventory.upsert.mockResolvedValue({ id: "inv1" } as never);
    prismaMock.batch.create.mockResolvedValue({} as never);

    const { json } = await expectJson(POST, createRequest("/api/purchases/receive", {
      method: "POST",
      body: { orderId: "po1", branchId: "b1", items: [{ medicineId: "m1", quantity: 10 }] },
    }));
    expect(json.success).toBe(true);
    expect(prismaMock.inventory.upsert).toBeCalledWith({
      where: { medicineId_branchId: { medicineId: "m1", branchId: "b1" } },
      update: { quantity: { increment: 10 } },
      create: { medicineId: "m1", branchId: "b1", quantity: 10 },
    });
    expect(prismaMock.batch.create).toBeCalledWith({
      data: expect.objectContaining({ medicineId: "m1", inventoryId: "inv1", quantity: 10, purchasePrice: 20, mrp: 25 }),
    });
  });

  it("rejects receive when PO is already received", async () => {
    prismaMock.purchaseOrder.findUnique.mockResolvedValue({ ...po, status: "RECEIVED" } as never);
    const { res } = await expectStatus(POST, createRequest("/api/purchases/receive", {
      method: "POST",
      body: { orderId: "po1", branchId: "b1", items: [{ medicineId: "m1", quantity: 10 }] },
    }), 400);
  });

  it("rejects quantity above the ordered amount", async () => {
    prismaMock.purchaseOrder.findUnique.mockResolvedValue(po as never);
    const { res } = await expectStatus(POST, createRequest("/api/purchases/receive", {
      method: "POST",
      body: { orderId: "po1", branchId: "b1", items: [{ medicineId: "m1", quantity: 100 }] },
    }), 400);
  });

  it("rejects items not on the purchase order", async () => {
    prismaMock.purchaseOrder.findUnique.mockResolvedValue(po as never);
    const { res } = await expectStatus(POST, createRequest("/api/purchases/receive", {
      method: "POST",
      body: { orderId: "po1", branchId: "b1", items: [{ medicineId: "m2", quantity: 5 }] },
    }), 400);
  });

  it("rejects missing orderId", async () => {
    const { res } = await expectStatus(POST, createRequest("/api/purchases/receive", {
      method: "POST",
      body: { items: [{ medicineId: "m1", quantity: 10 }] },
    }), 400);
  });
});
