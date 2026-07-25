import { GET, POST, PUT } from "@/app/api/purchases/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../helpers";

jest.mock("@/lib/utils", () => ({ generateInvoiceNumber: jest.fn(() => "PO-260701-00001") }));

describe("Purchases API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists purchase orders with pagination", async () => {
    prismaMock.purchaseOrder.findMany.mockResolvedValue([{ id: "po1", poNumber: "PO-001", items: [], supplier: { name: "Supplier" }, branch: { name: "Branch" }, createdBy: { name: "User" } }] as never);
    prismaMock.purchaseOrder.count.mockResolvedValue(1);
    const { json } = await expectJson(GET, createRequest("/api/purchases"));
    expect(json.orders).toHaveLength(1);
  });

  it("filters by status", async () => {
    prismaMock.purchaseOrder.findMany.mockResolvedValue([] as never);
    prismaMock.purchaseOrder.count.mockResolvedValue(0);
    const req = createRequest("/api/purchases?status=DRAFT");
    await expectJson(GET, req);
    expect(prismaMock.purchaseOrder.findMany).toBeCalledWith(
      expect.objectContaining({ where: { status: "DRAFT" } }),
    );
  });

  it("creates a purchase order", async () => {
    prismaMock.$transaction = jest.fn((fn: (tx: typeof prismaMock) => unknown) => fn(prismaMock)) as never;
    prismaMock.purchaseOrder.create.mockResolvedValue({ id: "po1", poNumber: "PO-001", items: [] } as never);
    prismaMock.invoiceCounter.upsert.mockResolvedValue({ prefix: "PO", counter: 1 } as never);

    const req = createRequest("/api/purchases", {
      method: "POST",
      body: { supplierId: "s1", branchId: "b1", items: [{ medicineId: "m1", quantity: 10, unitPrice: 20 }] },
    });
    const { json, res } = await expectJson(POST, req);
    expect(res.status).toBe(201);
  });

  it("updates a purchase order", async () => {
    prismaMock.purchaseOrder.update.mockResolvedValue({ id: "po1", status: "APPROVED" } as never);
    const req = createRequest("/api/purchases", { method: "PUT", body: { id: "po1", status: "APPROVED" } });
    const { json } = await expectJson(PUT, req);
    expect(json.status).toBe("APPROVED");
  });
});
