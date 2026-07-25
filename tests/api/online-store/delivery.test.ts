import { GET, PATCH } from "@/app/api/online-store/delivery/route";
import { prismaMock } from "../../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../../helpers";

describe("Online Store Delivery API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists deliveries", async () => {
    prismaMock.onlineOrder.findMany.mockResolvedValue([{
      id: "o1", orderNumber: "ORD-001", trackingNumber: "TRK-001", status: "SHIPPED",
      shippingAddress: "123 St", shippingCity: "Mumbai", shippingState: "MH", deliveryDate: new Date("2026-08-01"),
      items: [{ quantity: 2 }],
    }] as never);
    const { json } = await expectJson(GET, createRequest("/api/online-store/delivery"));
    expect(json.deliveries).toHaveLength(1);
    expect(json.deliveries[0].order).toBe("ORD-001");
  });

  it("searches deliveries", async () => {
    prismaMock.onlineOrder.findMany.mockResolvedValue([] as never);
    await expectJson(GET, createRequest("/api/online-store/delivery?search=TRK-001&status=SHIPPED"));
    expect(prismaMock.onlineOrder.findMany).toBeCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: "SHIPPED" }) }),
    );
  });

  it("patches delivery fields", async () => {
    prismaMock.onlineOrder.update.mockResolvedValue({} as never);
    const { json } = await expectJson(PATCH, createRequest("/api/online-store/delivery", { method: "PATCH", body: { id: "o1", status: "DELIVERED", trackingNumber: "TRK-NEW" } }));
    expect(prismaMock.onlineOrder.update).toBeCalledWith(
      expect.objectContaining({ where: { id: "o1" }, data: expect.objectContaining({ status: "DELIVERED", trackingNumber: "TRK-NEW" }) }),
    );
  });

  it("returns 400 without id on patch", async () => {
    const { res } = await expectStatus(PATCH, createRequest("/api/online-store/delivery", { method: "PATCH", body: { status: "DELIVERED" } }), 400);
  });
});
