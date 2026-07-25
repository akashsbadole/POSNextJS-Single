import { GET, POST, PUT, DELETE } from "@/app/api/suppliers/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../helpers";

describe("Suppliers API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists suppliers", async () => {
    prismaMock.supplier.findMany.mockResolvedValue([{ id: "s1", name: "MediCorp" }] as never);
    const { json } = await expectJson(GET, createRequest("/api/suppliers"));
    expect(json).toHaveLength(1);
  });

  it("creates a supplier", async () => {
    prismaMock.supplier.create.mockResolvedValue({ id: "s2", name: "PharmaPlus" } as never);
    const req = createRequest("/api/suppliers", { method: "POST", body: { name: "PharmaPlus", phone: "9876543210" } });
    const { json, res } = await expectJson(POST, req);
    expect(res.status).toBe(201);
  });

  it("updates a supplier", async () => {
    prismaMock.supplier.update.mockResolvedValue({ id: "s1", name: "Updated Corp" } as never);
    const req = createRequest("/api/suppliers", { method: "PUT", body: { id: "s1", name: "Updated Corp" } });
    const { json } = await expectJson(PUT, req);
    expect(json.name).toBe("Updated Corp");
  });

  it("soft-deletes a supplier", async () => {
    prismaMock.supplier.update.mockResolvedValue({} as never);
    const req = createRequest("/api/suppliers?id=s1", { method: "DELETE" });
    const { json } = await expectJson(DELETE, req);
    expect(json.success).toBe(true);
  });
});
