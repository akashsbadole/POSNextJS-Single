import { GET } from "@/app/api/online-store/products/route";
import { prismaMock } from "../../setup/mocks/prisma";
import { createRequest, expectJson } from "../../helpers";

describe("Online Store Products API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists products with pagination", async () => {
    prismaMock.medicine.findMany.mockResolvedValue([{ id: "m1", name: "Paracetamol", genericName: "Paracetamol", sellingPrice: 25, mrp: 30, isPrescriptionRequired: false, category: { name: "Analgesics" }, inventories: [{ quantity: 100, branch: { name: "Main" } }] }] as never);
    prismaMock.medicine.count.mockResolvedValue(1);
    const { json } = await expectJson(GET, createRequest("/api/online-store/products"));
    expect(json.products).toHaveLength(1);
    expect(json.products[0].stock).toBe(100);
    expect(json.pagination.total).toBe(1);
  });

  it("filters by search and category", async () => {
    prismaMock.medicine.findMany.mockResolvedValue([] as never);
    prismaMock.medicine.count.mockResolvedValue(0);
    await expectJson(GET, createRequest("/api/online-store/products?search=Paracetamol&category=Analgesics"));
    expect(prismaMock.medicine.findMany).toBeCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isActive: true }) }),
    );
  });
});
