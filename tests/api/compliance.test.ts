import { GET } from "@/app/api/compliance/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson } from "../helpers";

describe("Compliance API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("builds a rate-wise GSTR-1 summary from sales items", async () => {
    prismaMock.sale.findMany.mockResolvedValue([
      {
        invoiceNumber: "INV-1", createdAt: new Date("2026-08-01"), taxableAmount: 100, totalGst: 12, finalAmount: 112,
        paymentMode: "cash", paymentStatus: "PAID",
        branch: { gstin: "27ABCDE1234F1Z5", name: "Branch", address: "x", state: "MH" },
        items: [{ gstRate: 12, totalAmount: 112, cgstAmount: 6, sgstAmount: 6 }],
      },
    ] as never);

    const { json } = await expectJson(GET, createRequest("/api/compliance?report=gstr1"));
    expect(json.summary).toHaveLength(1);
    expect(json.summary[0]).toMatchObject({ rate: 12, taxable: 100, cgst: 6, sgst: 6, total: 112 });
    expect(json.invoices).toHaveLength(1);
    expect(json.branch.gstin).toBe("27ABCDE1234F1Z5");
  });

  it("builds a GSTR-2A summary from received purchase orders", async () => {
    prismaMock.purchaseOrder.findMany.mockResolvedValue([
      {
        poNumber: "PO-1", updatedAt: new Date("2026-08-02"), status: "RECEIVED",
        supplier: { name: "Sup", gstin: "27ZZZ" },
        items: [{ gstRate: 5, unitPrice: 20, receivedQty: 10 }],
      },
    ] as never);

    const { json } = await expectJson(GET, createRequest("/api/compliance?report=gstr2a"));
    expect(json.summary[0]).toMatchObject({ rate: 5, taxable: 200, cgst: 5, sgst: 5 });
    expect(json.purchases[0].gstin).toBe("27ZZZ");
  });

  it("flags licenses expiring within 90 days", async () => {
    const soon = new Date(Date.now() + 30 * 86400000);
    prismaMock.drugLicense.findMany.mockResolvedValue([
      { licenseNumber: "DL-1", licenseType: "RETAIL", holderName: "H", issuingAuthority: null, expiryDate: soon },
    ] as never);

    const { json } = await expectJson(GET, createRequest("/api/compliance?report=licenses"));
    expect(json.licenses[0].expiringSoon).toBe(true);
    expect(json.licenses[0].daysUntilExpiry).toBe(30);
  });

  it("lists restricted drug (Schedule X/H1) sales", async () => {
    prismaMock.saleItem.findMany.mockResolvedValue([
      {
        id: "si1", saleId: "s1", quantity: 2, unitPrice: 120,
        medicine: { name: "Diazepam", genericName: "diazepam", scheduleType: "X" },
        sale: {
          invoiceNumber: "INV-9", createdAt: new Date("2026-08-01"),
          patient: { name: "Ravi", phone: "9898" }, cashier: { name: "Ann" },
        },
      },
    ] as never);

    const { json } = await expectJson(GET, createRequest("/api/compliance?report=restricted"));
    expect(json.items).toHaveLength(1);
    expect(json.items[0]).toMatchObject({ scheduleType: "X", medicine: "Diazepam", patient: { name: "Ravi" } });
    expect(prismaMock.saleItem.findMany).toBeCalledWith(expect.objectContaining({ where: expect.objectContaining({ medicine: { scheduleType: { in: ["X", "H1"] } } }) }));
  });

  it("exports restricted drug sales as CSV", async () => {
    prismaMock.saleItem.findMany.mockResolvedValue([] as never);
    const res = await GET(createRequest("/api/compliance?report=restricted&format=csv"));
    expect(res.headers.get("content-type")).toContain("text/csv");
  });
});
