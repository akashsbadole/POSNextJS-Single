import { GET, POST, PUT, DELETE } from "@/app/api/medicines/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../helpers";

describe("Medicines API", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("GET", () => {
    it("lists medicines with pagination", async () => {
      prismaMock.medicine.findMany.mockResolvedValue([{ id: "m1", name: "Paracetamol", category: {}, supplier: null, inventories: [] }] as never);
      prismaMock.medicine.count.mockResolvedValue(1);
      const { json } = await expectJson(GET, createRequest("/api/medicines"));
      expect(json.medicines).toHaveLength(1);
      expect(json.pagination.total).toBe(1);
    });

    it("filters by search", async () => {
      prismaMock.medicine.findMany.mockResolvedValue([] as never);
      prismaMock.medicine.count.mockResolvedValue(0);
      const req = createRequest("/api/medicines?search=Paracetamol");
      await expectJson(GET, req);
      expect(prismaMock.medicine.findMany).toBeCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) }),
      );
    });
  });

  describe("POST", () => {
    it("creates a medicine with validation", async () => {
      prismaMock.$transaction = jest.fn((fn: (tx: typeof prismaMock) => unknown) => fn(prismaMock)) as never;
      prismaMock.medicine.create.mockResolvedValue({ id: "m1", name: "Paracetamol 500mg" } as never);

      const req = createRequest("/api/medicines", {
        method: "POST",
        body: {
          name: "Paracetamol 500mg", genericName: "Paracetamol", categoryId: "cat1",
          mrp: 30, purchasePrice: 20, sellingPrice: 25, gstRate: 5,
        },
      });
      const { json, res } = await expectJson(POST, req);
      expect(res.status).toBe(201);
      expect(json.name).toBe("Paracetamol 500mg");
    });

    it("rejects invalid data", async () => {
      const req = createRequest("/api/medicines", {
        method: "POST",
        body: { name: "", genericName: "", categoryId: "", mrp: -1, purchasePrice: -1, sellingPrice: -1 },
      });
      const { res } = await expectStatus(POST, req, 400);
      const json = await res.json();
      expect(json.error).toBe("Validation failed");
    });
  });

  describe("PUT", () => {
    it("updates a medicine", async () => {
      prismaMock.medicine.findUnique.mockResolvedValue({ id: "m1" } as never);
      prismaMock.medicine.update.mockResolvedValue({ id: "m1", name: "Updated" } as never);
      const req = createRequest("/api/medicines", { method: "PUT", body: { id: "m1", name: "Updated" } });
      const { json } = await expectJson(PUT, req);
      expect(json.name).toBe("Updated");
    });

    it("returns 404 for missing medicine", async () => {
      prismaMock.medicine.findUnique.mockResolvedValue(null);
      const req = createRequest("/api/medicines", { method: "PUT", body: { id: "missing", name: "X" } });
      const { res } = await expectStatus(PUT, req, 404);
    });
  });

  describe("DELETE", () => {
    it("soft-deletes a medicine", async () => {
      prismaMock.medicine.findUnique.mockResolvedValue({ id: "m1" } as never);
      prismaMock.medicine.update.mockResolvedValue({} as never);
      const req = createRequest("/api/medicines?id=m1", { method: "DELETE" });
      const { json } = await expectJson(DELETE, req);
      expect(json.success).toBe(true);
    });

    it("returns 404 for missing medicine", async () => {
      prismaMock.medicine.findUnique.mockResolvedValue(null);
      const req = createRequest("/api/medicines?id=missing", { method: "DELETE" });
      const { res } = await expectStatus(DELETE, req, 404);
    });
  });
});
