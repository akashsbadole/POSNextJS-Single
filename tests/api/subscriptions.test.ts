import { GET, POST, PATCH, DELETE } from "@/app/api/subscriptions/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../helpers";

describe("Subscriptions API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists subscriptions with pagination", async () => {
    prismaMock.subscription.findMany.mockResolvedValue([{ id: "sub1", name: "Monthly Meds", customer: {}, items: [], deliveries: [] }] as never);
    prismaMock.subscription.count.mockResolvedValue(1);
    const { json } = await expectJson(GET, createRequest("/api/subscriptions"));
    expect(json.subscriptions).toHaveLength(1);
  });

  it("creates a subscription", async () => {
    prismaMock.medicine.findUnique.mockResolvedValue({ id: "m1", name: "Paracetamol", sellingPrice: 25 } as never);
    prismaMock.subscription.create.mockResolvedValue({ id: "sub1", name: "Monthly Meds", items: [], customer: {} } as never);
    const { json, res } = await expectJson(POST, createRequest("/api/subscriptions", {
      method: "POST",
      body: { customerId: "c1", name: "Monthly Meds", items: [{ medicineId: "m1", quantity: 2 }] },
    }));
    expect(res.status).toBe(201);
  });

  it("rejects missing required fields", async () => {
    const { res } = await expectStatus(POST, createRequest("/api/subscriptions", {
      method: "POST",
      body: { customerId: "c1" },
    }), 400);
  });

  it("returns 404 for missing medicine", async () => {
    prismaMock.medicine.findUnique.mockResolvedValue(null);
    const { res } = await expectStatus(POST, createRequest("/api/subscriptions", {
      method: "POST",
      body: { customerId: "c1", name: "Test", items: [{ medicineId: "missing", quantity: 1 }] },
    }), 404);
  });

  it("patches subscription status", async () => {
    prismaMock.subscription.update.mockResolvedValue({ id: "sub1", status: "PAUSED" } as never);
    const { json } = await expectJson(PATCH, createRequest("/api/subscriptions", { method: "PATCH", body: { id: "sub1", status: "PAUSED" } }));
    expect(json.status).toBe("PAUSED");
  });

  it("soft-cancels via DELETE", async () => {
    prismaMock.subscription.update.mockResolvedValue({} as never);
    const { json } = await expectJson(DELETE, createRequest("/api/subscriptions?id=sub1", { method: "DELETE" }));
    expect(json.success).toBe(true);
  });
});
