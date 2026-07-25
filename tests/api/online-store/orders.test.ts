import { GET, POST, PATCH } from "@/app/api/online-store/orders/route";
import { prismaMock } from "../../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../../helpers";

jest.mock("@/lib/utils", () => ({ generateInvoiceNumber: jest.fn(() => "ORD-260701-00001") }));

describe("Online Store Orders API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists orders with pagination", async () => {
    prismaMock.onlineOrder.findMany.mockResolvedValue([{ id: "o1", orderNumber: "ORD-001", customer: {}, items: [] }] as never);
    prismaMock.onlineOrder.count.mockResolvedValue(1);
    const { json } = await expectJson(GET, createRequest("/api/online-store/orders"));
    expect(json.orders).toHaveLength(1);
  });

  it("creates an order", async () => {
    prismaMock.medicine.findUnique.mockResolvedValue({ id: "m1", sellingPrice: 100 } as never);
    prismaMock.onlineOrder.create.mockResolvedValue({ id: "o1", orderNumber: "ORD-001", items: [] } as never);
    prismaMock.invoiceCounter.upsert.mockResolvedValue({ prefix: "ORD", counter: 1 } as never);
    const { json, res } = await expectJson(POST, createRequest("/api/online-store/orders", { method: "POST", body: { customerId: "c1", items: [{ medicineId: "m1", quantity: 2 }] } }));
    expect(res.status).toBe(201);
  });

  it("rejects missing customerId", async () => {
    const { res } = await expectStatus(POST, createRequest("/api/online-store/orders", { method: "POST", body: { items: [] } }), 400);
  });

  it("patches order status", async () => {
    prismaMock.onlineOrder.update.mockResolvedValue({ id: "o1", status: "SHIPPED" } as never);
    const { json } = await expectJson(PATCH, createRequest("/api/online-store/orders", { method: "PATCH", body: { id: "o1", status: "SHIPPED" } }));
    expect(json.status).toBe("SHIPPED");
  });
});
