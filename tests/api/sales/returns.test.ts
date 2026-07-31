import { GET, POST } from "@/app/api/sales/returns/route";
import { prismaMock } from "../../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../../helpers";

jest.mock("@/lib/utils", () => ({ generateInvoiceNumber: jest.fn(() => "RMA-260701-00001") }));

describe("Sales Returns API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists returns with pagination", async () => {
    prismaMock.saleReturn.findMany.mockResolvedValue([{ id: "r1", returnNumber: "RMA-001", sale: {}, items: [] }] as never);
    prismaMock.saleReturn.count.mockResolvedValue(1);
    const { json } = await expectJson(GET, createRequest("/api/sales/returns"));
    expect(json.returns).toHaveLength(1);
  });

  it("creates a return for items that were on the sale", async () => {
    prismaMock.$transaction = jest.fn((fn: (tx: typeof prismaMock) => unknown) => fn(prismaMock)) as never;
    prismaMock.sale.findUnique.mockResolvedValue({ id: "s1", items: [{ medicineId: "m1", quantity: 5 }] } as never);
    prismaMock.saleReturn.create.mockResolvedValue({ id: "r1", returnNumber: "RMA-001", items: [] } as never);
    prismaMock.inventory.updateMany.mockResolvedValue({ count: 1 } as never);
    prismaMock.invoiceCounter.upsert.mockResolvedValue({ prefix: "RMA", counter: 1 } as never);

    const { json, res } = await expectJson(POST, createRequest("/api/sales/returns", {
      method: "POST",
      body: { saleId: "s1", branchId: "b1", items: [{ medicineId: "m1", quantity: 2, unitPrice: 10 }], reason: "Damaged" },
    }));
    expect(res.status).toBe(201);
    expect(json.returnNumber).toBeDefined();
  });

  it("rejects returning items not on the sale", async () => {
    prismaMock.sale.findUnique.mockResolvedValue({ id: "s1", items: [{ medicineId: "m1", quantity: 5 }] } as never);
    const { res } = await expectStatus(POST, createRequest("/api/sales/returns", {
      method: "POST",
      body: { saleId: "s1", branchId: "b1", items: [{ medicineId: "m9", quantity: 1 }], reason: "Damaged" },
    }), 400);
  });

  it("rejects returning more than was sold", async () => {
    prismaMock.sale.findUnique.mockResolvedValue({ id: "s1", items: [{ medicineId: "m1", quantity: 5 }] } as never);
    const { res } = await expectStatus(POST, createRequest("/api/sales/returns", {
      method: "POST",
      body: { saleId: "s1", branchId: "b1", items: [{ medicineId: "m1", quantity: 6 }], reason: "Damaged" },
    }), 400);
  });
});
