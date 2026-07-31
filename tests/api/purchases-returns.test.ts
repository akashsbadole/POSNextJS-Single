import { GET, POST } from "@/app/api/purchases/returns/route";
import { prismaMock, armLedgerMocks } from "../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus, setRole } from "../helpers";

jest.mock("@/lib/utils", () => ({
  generateInvoiceNumber: jest.fn(() => "PRET-260801-00001"),
}));

const txMock = prismaMock;

function runTx(fn: (tx: typeof prismaMock) => unknown) {
  prismaMock.$transaction = jest.fn((arg: unknown) => {
    if (Array.isArray(arg)) return Promise.all(arg as Promise<unknown>[]);
    return (arg as (tx: typeof prismaMock) => unknown)(txMock);
  }) as never;
}

describe("Purchase Returns API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  armLedgerMocks();
    setRole("MANAGER");
  });

  describe("GET", () => {
    it("lists returns with pagination", async () => {
      prismaMock.purchaseReturn.findMany.mockResolvedValue([{ id: "r1", returnNumber: "PRET-1", items: [], po: {}, supplier: {}, createdBy: {} }] as never);
      prismaMock.purchaseReturn.count.mockResolvedValue(1);
      const { json } = await expectJson(GET, createRequest("/api/purchases/returns"));
      expect(json.returns).toHaveLength(1);
    });
  });

  describe("POST", () => {
    it("creates a return and decrements stock and batch", async () => {
      prismaMock.purchaseOrder.findUnique.mockResolvedValue({
        id: "po1", branchId: "b1", supplierId: "sup1", status: "RECEIVED",
        items: [{ medicineId: "m1", receivedQty: 100, unitPrice: 10, gstRate: 5 }],
      } as never);
      prismaMock.purchaseReturnItem.findMany.mockResolvedValue([] as never);
      prismaMock.batch.findFirst.mockResolvedValue({ id: "batch1", medicineId: "m1", quantity: 100 } as never);
      prismaMock.purchaseReturn.create.mockResolvedValue({ id: "r1", returnNumber: "PRET-260801-00001", items: [] } as never);
      prismaMock.invoiceCounter.upsert.mockResolvedValue({ prefix: "PRET", counter: 1 } as never);
      prismaMock.auditLog.create.mockResolvedValue({} as never);
      runTx((tx) => tx);

      const req = createRequest("/api/purchases/returns", {
        method: "POST",
        body: { branchId: "b1", poId: "po1", reason: "damaged", items: [{ medicineId: "m1", quantity: 5 }] },
      });
      const { json, res } = await expectJson(POST, req);
      expect(res.status).toBe(201);
      expect(prismaMock.inventory.update).toBeCalledWith(expect.objectContaining({ data: { quantity: { decrement: 5 } } }));
      expect(prismaMock.batch.update).toBeCalledWith(expect.objectContaining({ where: { id: "batch1" }, data: { quantity: { decrement: 5 } } }));
      expect(json.returnNumber).toBeDefined();
    });

    it("rejects returning more than received", async () => {
      prismaMock.purchaseOrder.findUnique.mockResolvedValue({
        id: "po1", branchId: "b1", supplierId: "sup1", status: "RECEIVED",
        items: [{ medicineId: "m1", receivedQty: 10, unitPrice: 10, gstRate: 5 }],
      } as never);
      prismaMock.purchaseReturnItem.findMany.mockResolvedValue([] as never);
      runTx((tx) => tx);

      const req = createRequest("/api/purchases/returns", {
        method: "POST",
        body: { branchId: "b1", poId: "po1", items: [{ medicineId: "m1", quantity: 11 }] },
      });
      const { res } = await expectStatus(POST, req, 400);
    });

    it("rejects a PO from another branch", async () => {
      prismaMock.purchaseOrder.findUnique.mockResolvedValue({
        id: "po1", branchId: "other", supplierId: "sup1", status: "RECEIVED", items: [],
      } as never);
      runTx((tx) => tx);

      const req = createRequest("/api/purchases/returns", {
        method: "POST",
        body: { branchId: "b1", poId: "po1", items: [{ medicineId: "m1", quantity: 1 }] },
      });
      const { res } = await expectStatus(POST, req, 400);
    });
  });
});
