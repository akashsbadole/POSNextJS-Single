import { POST } from "@/app/api/purchases/receive/route";
import { prismaMock } from "../../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../../helpers";

describe("Purchase Receive API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("receives goods and updates inventory", async () => {
    prismaMock.$transaction = jest.fn((fn: (tx: typeof prismaMock) => unknown) => fn(prismaMock)) as never;
    prismaMock.purchaseOrder.update.mockResolvedValue({} as never);
    prismaMock.inventory.findFirst.mockResolvedValue({ id: "inv1", medicineId: "m1", branchId: "b1", quantity: 50 } as never);
    prismaMock.inventory.update.mockResolvedValue({} as never);

    const { json } = await expectJson(POST, createRequest("/api/purchases/receive", {
      method: "POST",
      body: { orderId: "po1", branchId: "b1", items: [{ medicineId: "m1", quantity: 10 }] },
    }));
    expect(json.success).toBe(true);
  });

  it("creates new inventory record when none exists", async () => {
    prismaMock.$transaction = jest.fn((fn: (tx: typeof prismaMock) => unknown) => fn(prismaMock)) as never;
    prismaMock.purchaseOrder.update.mockResolvedValue({} as never);
    prismaMock.inventory.findFirst.mockResolvedValue(null);
    prismaMock.inventory.create.mockResolvedValue({} as never);

    const { json } = await expectJson(POST, createRequest("/api/purchases/receive", {
      method: "POST",
      body: { orderId: "po1", branchId: "b1", items: [{ medicineId: "m1", quantity: 100 }] },
    }));
    expect(json.success).toBe(true);
    expect(prismaMock.inventory.create).toBeCalledWith({ data: { medicineId: "m1", branchId: "b1", quantity: 100 } });
  });

  it("rejects missing orderId", async () => {
    const { res } = await expectStatus(POST, createRequest("/api/purchases/receive", {
      method: "POST",
      body: { items: [{ medicineId: "m1", quantity: 10 }] },
    }), 400);
  });
});
