import { GET } from "@/app/api/reports/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson } from "../helpers";

describe("Reports API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("computes KPIs from sales data", async () => {
    const saleItem = { id: "si1", medicineId: "m1", quantity: 2, unitPrice: 100, totalAmount: 200, medicine: { id: "m1", name: "Paracetamol" } };
    prismaMock.sale.findMany.mockResolvedValue([
      { id: "s1", finalAmount: 500, cgstAmount: 25, sgstAmount: 25, taxableAmount: 450, createdAt: new Date("2026-07-01"), items: [saleItem] },
    ] as never);

    const { json } = await expectJson(GET, createRequest("/api/reports?startDate=2026-01-01&endDate=2026-12-31"));
    expect(json.kpis.totalRevenue).toBe(500);
    expect(json.kpis.totalOrders).toBe(1);
    expect(json.kpis.avgOrderValue).toBe(500);
    expect(json.kpis.totalGST).toBe(50);
    expect(json.trend).toHaveLength(1);
    expect(json.topMedicines).toHaveLength(1);
  });

  it("returns zeroes when no sales", async () => {
    prismaMock.sale.findMany.mockResolvedValue([] as never);
    const { json } = await expectJson(GET, createRequest("/api/reports"));
    expect(json.kpis.totalRevenue).toBe(0);
    expect(json.kpis.totalOrders).toBe(0);
    expect(json.kpis.avgOrderValue).toBe(0);
    expect(json.trend).toEqual([]);
    expect(json.topMedicines).toEqual([]);
  });
});
