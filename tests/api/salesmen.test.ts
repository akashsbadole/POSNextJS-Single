import { GET, POST } from "@/app/api/salesmen/route";
import { PATCH, DELETE } from "@/app/api/salesmen/[id]/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus, setRole } from "../helpers";

describe("Salesmen API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists salesmen with commission totals", async () => {
    prismaMock.salesman.findMany.mockResolvedValue([
      { id: "sm1", name: "Ravi", phone: null, commissionRate: 5, isActive: true, createdAt: new Date(), sales: [] },
    ] as never);
    prismaMock.sale.aggregate.mockResolvedValue({ _sum: { finalAmount: 10000 }, _count: 4 } as never);

    const { json } = await expectJson(GET, createRequest("/api/salesmen"));
    expect(json.salesmen[0]).toMatchObject({ salesCount: 4, salesValue: 10000, commissionEarned: 500 });
  });

  it("creates a salesman", async () => {
    setRole("MANAGER");
    prismaMock.salesman.create.mockResolvedValue({ id: "sm2", name: "Sita", commissionRate: 10 } as never);
    const req = createRequest("/api/salesmen", { method: "POST", body: { name: "Sita", commissionRate: 10 } });
    const { json, res } = await expectJson(POST, req);
    expect(res.status).toBe(201);
    expect(json.name).toBe("Sita");
  });

  it("rejects an out-of-range commission rate", async () => {
    setRole("MANAGER");
    const req = createRequest("/api/salesmen", { method: "POST", body: { name: "X", commissionRate: 150 } });
    const { res } = await expectStatus(POST, req, 400);
  });

  it("rejects cashiers from managing salesmen", async () => {
    setRole("CASHIER");
    const req = createRequest("/api/salesmen", { method: "POST", body: { name: "X" } });
    const { res } = await expectStatus(POST, req, 403);
  });

  it("updates a salesman", async () => {
    setRole("MANAGER");
    prismaMock.salesman.findUnique.mockResolvedValue({ id: "sm1" } as never);
    prismaMock.salesman.update.mockResolvedValue({ id: "sm1", commissionRate: 7.5 } as never);
    const req = createRequest("/api/salesmen/sm1", { method: "PATCH", body: { commissionRate: 7.5 } });
    const { json, res } = await expectJson(PATCH, req, [{ params: Promise.resolve({ id: "sm1" }) }]);
    expect(res.status).toBe(200);
    expect(json.commissionRate).toBe(7.5);
  });

  it("deactivates instead of deleting", async () => {
    setRole("OWNER");
    prismaMock.salesman.update.mockResolvedValue({ id: "sm1", isActive: false } as never);
    const req = createRequest("/api/salesmen/sm1", { method: "DELETE" });
    const { res } = await expectStatus(DELETE, req, 200, [{ params: Promise.resolve({ id: "sm1" }) }]);
    expect(prismaMock.salesman.update).toHaveBeenCalledWith(expect.objectContaining({ data: { isActive: false } }));
  });
});
