import { GET, POST, PUT } from "@/app/api/inventory/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson } from "../helpers";

describe("Inventory API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists inventory with pagination", async () => {
    prismaMock.inventory.findMany.mockResolvedValue([{ id: "inv1", medicine: { name: "Paracetamol" }, branch: { name: "Main" }, batches: [] }] as never);
    prismaMock.inventory.count.mockResolvedValue(1);
    const { json } = await expectJson(GET, createRequest("/api/inventory"));
    expect(json.inventory).toHaveLength(1);
  });

  it("creates inventory record", async () => {
    prismaMock.inventory.create.mockResolvedValue({ id: "inv1", medicineId: "m1", branchId: "b1", quantity: 100 } as never);
    const req = createRequest("/api/inventory", { method: "POST", body: { medicineId: "m1", branchId: "b1", quantity: 100 } });
    const { json, res } = await expectJson(POST, req);
    expect(res.status).toBe(201);
  });

  it("updates inventory", async () => {
    prismaMock.inventory.update.mockResolvedValue({ id: "inv1", quantity: 200 } as never);
    const req = createRequest("/api/inventory", { method: "PUT", body: { id: "inv1", quantity: 200 } });
    const { json } = await expectJson(PUT, req);
    expect(json.quantity).toBe(200);
  });
});
