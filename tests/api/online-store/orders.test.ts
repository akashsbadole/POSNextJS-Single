import { GET, PATCH } from "@/app/api/online-store/orders/route";
import { prismaMock } from "../../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../../helpers";

describe("Online Store Orders API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists orders with pagination", async () => {
    prismaMock.onlineOrder.findMany.mockResolvedValue([{ id: "o1", orderNumber: "ORD-001", customer: {}, items: [] }] as never);
    prismaMock.onlineOrder.count.mockResolvedValue(1);
    const { json } = await expectJson(GET, createRequest("/api/online-store/orders"));
    expect(json.orders).toHaveLength(1);
  });

  it("patches order status", async () => {
    prismaMock.onlineOrder.update.mockResolvedValue({ id: "o1", status: "SHIPPED" } as never);
    const { json } = await expectJson(PATCH, createRequest("/api/online-store/orders", { method: "PATCH", body: { id: "o1", status: "SHIPPED" } }));
    expect(json.status).toBe("SHIPPED");
  });

  it("rejects unknown order status", async () => {
    await expectStatus(PATCH, createRequest("/api/online-store/orders", { method: "PATCH", body: { id: "o1", status: "HACKED" } }), 400);
  });
});
