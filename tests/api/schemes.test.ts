import { GET, POST, PUT, DELETE } from "@/app/api/schemes/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../helpers";

describe("Schemes API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists schemes", async () => {
    prismaMock.scheme.findMany.mockResolvedValue([{ id: "sch1", name: "Diwali Offer", priority: 10 }] as never);
    const { json } = await expectJson(GET, createRequest("/api/schemes"));
    expect(json).toHaveLength(1);
  });

  it("filters by isActive", async () => {
    prismaMock.scheme.findMany.mockResolvedValue([] as never);
    await expectJson(GET, createRequest("/api/schemes?isActive=true"));
    expect(prismaMock.scheme.findMany).toBeCalledWith(expect.objectContaining({ where: { isActive: true } }));
  });

  it("creates a scheme", async () => {
    prismaMock.scheme.create.mockResolvedValue({ id: "sch1", name: "New Scheme" } as never);
    const { json, res } = await expectJson(POST, createRequest("/api/schemes", { method: "POST", body: { name: "New Scheme", schemeType: "CASH_DISCOUNT", conditions: "{}", rewards: "{}", priority: 0, isActive: true } }));
    expect(res.status).toBe(201);
  });

  it("updates a scheme", async () => {
    prismaMock.scheme.update.mockResolvedValue({ id: "sch1", name: "Updated" } as never);
    const { json } = await expectJson(PUT, createRequest("/api/schemes", { method: "PUT", body: { id: "sch1", name: "Updated" } }));
    expect(json.name).toBe("Updated");
  });

  it("soft-deletes a scheme", async () => {
    prismaMock.scheme.update.mockResolvedValue({} as never);
    const { json } = await expectJson(DELETE, createRequest("/api/schemes?id=sch1", { method: "DELETE" }));
    expect(json.success).toBe(true);
  });
});
