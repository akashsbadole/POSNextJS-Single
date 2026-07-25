import { GET } from "@/app/api/dashboard/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson } from "../helpers";

describe("Dashboard API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns aggregated stats", async () => {
    prismaMock.medicine.count.mockResolvedValue(100);
    prismaMock.patient.count.mockResolvedValue(50);
    prismaMock.sale.count.mockResolvedValue(200);
    prismaMock.sale.aggregate.mockResolvedValue({ _sum: { finalAmount: 50000 } } as never);
    prismaMock.inventory.count.mockResolvedValue(3);
    prismaMock.sale.findMany.mockResolvedValue([] as never);

    const { json } = await expectJson(GET, createRequest("/api/dashboard"));
    expect(json.totalMedicines).toBe(100);
    expect(json.totalPatients).toBe(50);
    expect(json.totalSales).toBe(200);
    expect(json.totalRevenue).toBe(50000);
    expect(json.lowStockCount).toBe(3);
  });
});
