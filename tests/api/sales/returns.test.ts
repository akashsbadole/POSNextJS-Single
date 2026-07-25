import { GET, POST } from "@/app/api/sales/returns/route";
import { prismaMock } from "../../setup/mocks/prisma";
import { createRequest, expectJson } from "../../helpers";

jest.mock("@/lib/utils", () => ({ generateInvoiceNumber: jest.fn(() => "RMA-260701-00001") }));

describe("Sales Returns API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists returns with pagination", async () => {
    prismaMock.saleReturn.findMany.mockResolvedValue([{ id: "r1", returnNumber: "RMA-001", sale: {}, items: [] }] as never);
    prismaMock.saleReturn.count.mockResolvedValue(1);
    const { json } = await expectJson(GET, createRequest("/api/sales/returns"));
    expect(json.returns).toHaveLength(1);
  });

  it("creates a return with transaction", async () => {
    prismaMock.$transaction = jest.fn((fn: (tx: typeof prismaMock) => unknown) => fn(prismaMock)) as never;
    prismaMock.saleReturn.create.mockResolvedValue({ id: "r1", returnNumber: "RMA-001", items: [] } as never);
    prismaMock.inventory.updateMany.mockResolvedValue({ count: 1 } as never);
    prismaMock.invoiceCounter.upsert.mockResolvedValue({ prefix: "RMA", counter: 1 } as never);

    const { json, res } = await expectJson(POST, createRequest("/api/sales/returns", {
      method: "POST",
      body: { saleId: "s1", items: [{ medicineId: "m1", quantity: 2 }], reason: "Damaged" },
    }));
    expect(res.status).toBe(201);
    expect(json.returnNumber).toBeDefined();
  });
});
