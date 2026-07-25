import { GET, POST, PUT, DELETE } from "@/app/api/categories/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus, setUnauthenticated } from "../helpers";

describe("Categories API", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("GET", () => {
    it("lists all categories", async () => {
      prismaMock.category.findMany.mockResolvedValue([
        { id: "c1", name: "Painkillers", description: "Analgesics", isActive: true, parentId: null, createdAt: new Date(), updatedAt: new Date(), _count: { medicines: 5 } },
      ] as never);
      const { json } = await expectJson(GET, createRequest("/api/categories"));
      expect(json).toHaveLength(1);
      expect(json[0].name).toBe("Painkillers");
    });

    it("returns 401 without auth", async () => {
      setUnauthenticated();
      await expectStatus(GET, createRequest("/api/categories"), 401);
    });
  });

  describe("POST", () => {
    it("creates a category", async () => {
      prismaMock.category.create.mockResolvedValue({ id: "c2", name: "Vitamins" } as never);
      const req = createRequest("/api/categories", { method: "POST", body: { name: "Vitamins", description: "Supplements" } });
      const { json, res } = await expectJson(POST, req);
      expect(res.status).toBe(201);
      expect(json.name).toBe("Vitamins");
    });
  });

  describe("PUT", () => {
    it("updates a category", async () => {
      prismaMock.category.update.mockResolvedValue({ id: "c1", name: "Painkillers Updated" } as never);
      const req = createRequest("/api/categories", { method: "PUT", body: { id: "c1", name: "Painkillers Updated" } });
      const { json } = await expectJson(PUT, req);
      expect(json.name).toBe("Painkillers Updated");
    });

    it("returns 400 without id", async () => {
      const req = createRequest("/api/categories", { method: "PUT", body: { name: "No ID" } });
      await expectStatus(PUT, req, 400);
    });
  });

  describe("DELETE", () => {
    it("soft-deletes a category", async () => {
      prismaMock.category.update.mockResolvedValue({} as never);
      const req = createRequest("/api/categories?id=c1", { method: "DELETE" });
      const { json } = await expectJson(DELETE, req);
      expect(json.success).toBe(true);
      expect(prismaMock.category.update).toBeCalledWith({ where: { id: "c1" }, data: { isActive: false } });
    });

    it("returns 400 without id", async () => {
      const req = createRequest("/api/categories", { method: "DELETE" });
      await expectStatus(DELETE, req, 400);
    });
  });
});
