import { GET, POST, PUT } from "@/app/api/promise-orders/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../helpers";

describe("Promise Orders API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists orders", async () => {
    prismaMock.promiseOrder.findMany.mockResolvedValue([{ id: "po1", medicine: {}, customerName: "John", status: "PENDING" }] as never);
    prismaMock.promiseOrder.count.mockResolvedValue(1);
    const { json } = await expectJson(GET, createRequest("/api/promise-orders"));
    expect(json.orders).toHaveLength(1);
  });

  it("creates an order", async () => {
    prismaMock.promiseOrder.create.mockResolvedValue({ id: "po1", customerName: "John", status: "PENDING" } as never);
    const { json, res } = await expectJson(POST, createRequest("/api/promise-orders", { method: "POST", body: { medicineId: "m1", customerName: "John", quantity: 5, promiseDate: "2026-08-01" } }));
    expect(res.status).toBe(201);
  });

  it("updates an order", async () => {
    prismaMock.promiseOrder.update.mockResolvedValue({ id: "po1", status: "FULFILLED" } as never);
    const { json } = await expectJson(PUT, createRequest("/api/promise-orders", { method: "PUT", body: { id: "po1", status: "FULFILLED" } }));
    expect(json.status).toBe("FULFILLED");
  });

  it("returns 400 without id on update", async () => {
    await expectStatus(PUT, createRequest("/api/promise-orders", { method: "PUT", body: { status: "FULFILLED" } }), 400);
  });
});
