import { GET, POST } from "@/app/api/sales/[id]/e-invoice/route";
import { prismaMock, armLedgerMocks } from "../../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../../helpers";

jest.mock("@/lib/gsp", () => ({
  submitEInvoice: jest.fn(() => Promise.resolve({ success: true, irn: "IRN-TEST-123" })),
  cancelEInvoice: jest.fn(() => Promise.resolve({ success: true })),
}));

const mockParams = { params: Promise.resolve({ id: "s1" }) };

describe("E-Invoice API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    armLedgerMocks();
  });

  it("generates e-invoice for a sale", async () => {
    prismaMock.sale.findUnique.mockResolvedValue({
      id: "s1", invoiceNumber: "INV-001", finalAmount: 500, subtotal: 480, taxableAmount: 450,
      totalGst: 50, cgstAmount: 25, sgstAmount: 25, roundOff: 0,
      cashierId: "u1", paymentMode: "CASH", createdAt: new Date(),
      branch: { id: "b1", name: "Main", state: "Maharashtra", gstin: "27AAAAA0000A1Z5", address: "Addr", city: "Mumbai", pincode: "400001" },
      patient: { id: "p1", name: "Patient", state: "Maharashtra" },
      items: [{ id: "si1", medicineId: "m1", quantity: 2, unitPrice: 250, totalAmount: 500, discountAmount: 0, gstRate: 5, cgstAmount: 12, sgstAmount: 12, medicine: { id: "m1", name: "Paracetamol", hsnCode: "3004", unitOfMeasure: "PCS" } }],
    } as never);
    prismaMock.sale.update.mockResolvedValue({} as never);
    prismaMock.auditLog.create.mockResolvedValue({} as never);

    const req = createRequest("/api/sales/s1/e-invoice", { method: "POST" });
    const { json } = await expectJson(POST, req, [mockParams]);
    expect(json.success).toBe(true);
    expect(json.eInvoiceId).toBe("IRN-TEST-123");
    expect(json.payload).toBeDefined();
  });

  it("fails closed (502) when GSP is not configured", async () => {
    const { submitEInvoice } = jest.requireMock("@/lib/gsp") as { submitEInvoice: jest.Mock };
    submitEInvoice.mockResolvedValueOnce({ success: false, error: "GSP not configured" });
    prismaMock.sale.findUnique.mockResolvedValue({
      id: "s1", invoiceNumber: "INV-001", finalAmount: 500, subtotal: 480, taxableAmount: 450,
      totalGst: 50, cgstAmount: 25, sgstAmount: 25, roundOff: 0,
      cashierId: "u1", paymentMode: "CASH", createdAt: new Date(),
      branch: { id: "b1", name: "Main", state: "Maharashtra", gstin: "27AAAAA0000A1Z5", address: "Addr", city: "Mumbai", pincode: "400001" },
      patient: { id: "p1", name: "Patient", state: "Maharashtra" },
      items: [{ id: "si1", medicineId: "m1", quantity: 2, unitPrice: 250, totalAmount: 500, discountAmount: 0, gstRate: 5, cgstAmount: 12, sgstAmount: 12, medicine: { id: "m1", name: "Paracetamol", hsnCode: "3004", unitOfMeasure: "PCS" } }],
    } as never);
    const req = createRequest("/api/sales/s1/e-invoice", { method: "POST" });
    const { res } = await expectStatus(POST, req, 502, [mockParams]);
    expect(prismaMock.sale.update).not.toBeCalled();
  });

  it("returns 404 for missing sale", async () => {
    prismaMock.sale.findUnique.mockResolvedValue(null);
    const req = createRequest("/api/sales/s1/e-invoice", { method: "POST" });
    const { res } = await expectStatus(POST, req, 404, [mockParams]);
  });
});
