import { GET, POST } from "@/app/api/sales/route";
import { prismaMock, armLedgerMocks } from "../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../helpers";

jest.mock("@/lib/utils", () => ({
  generateInvoiceNumber: jest.fn(() => "INV-260701-00001"),
  calculateGST: jest.fn((amount: number, rate: number) => {
    const total = (amount * rate) / 100;
    return { cgst: total / 2, sgst: total / 2, total };
  }),
  calculateGSTInclusive: jest.fn((amount: number, rate: number) => {
    const base = amount / (1 + rate / 100);
    const tax = amount - base;
    return { cgst: tax / 2, sgst: tax / 2, total: amount };
  }),
}));

jest.mock("@/lib/inventory", () => ({
  pickBatchFEFO: jest.fn(() => Promise.resolve([{ batchId: "b1", batchNumber: "BATCH-001", pickQty: 10, remainingQty: 0 }])),
}));

describe("Sales API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    armLedgerMocks();
    prismaMock.scheme.findMany.mockResolvedValue([] as never);
  });

  describe("GET", () => {
    it("lists sales with pagination", async () => {
      prismaMock.sale.findMany.mockResolvedValue([{ id: "s1", invoiceNumber: "INV-001", items: [], patient: {}, cashier: { name: "Cashier" } }] as never);
      prismaMock.sale.count.mockResolvedValue(1);
      const { json } = await expectJson(GET, createRequest("/api/sales"));
      expect(json.sales).toHaveLength(1);
    });

    it("filters by date range", async () => {
      prismaMock.sale.findMany.mockResolvedValue([] as never);
      prismaMock.sale.count.mockResolvedValue(0);
      const req = createRequest("/api/sales?startDate=2026-01-01&endDate=2026-12-31");
      await expectJson(GET, req);
      expect(prismaMock.sale.findMany).toBeCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ createdAt: expect.any(Object) }) }),
      );
    });
  });

  describe("POST", () => {
    it("creates a sale transactionally", async () => {
      prismaMock.medicine.findUnique.mockResolvedValue({ id: "m1", name: "Paracetamol", sellingPrice: 25, mrp: 30, gstRate: 5, scheduleType: null } as never);
      prismaMock.batch.findMany.mockResolvedValue([{ id: "b1", batchNumber: "B-001", quantity: 50, expiryDate: new Date("2027-01-01") }] as never);
      prismaMock.$transaction = jest.fn((fn: (tx: typeof prismaMock) => unknown) => fn(prismaMock)) as never;
      prismaMock.sale.create.mockResolvedValue({ id: "s1", invoiceNumber: "INV-001", items: [], patient: {} } as never);
      prismaMock.invoiceCounter.upsert.mockResolvedValue({ prefix: "INV", counter: 1 } as never);
      prismaMock.auditLog.create.mockResolvedValue({} as never);

      const req = createRequest("/api/sales", {
        method: "POST",
        body: { items: [{ medicineId: "m1", quantity: 2 }], patientId: "p1", paymentMode: "cash", branchId: "b1", cashierId: "u1" },
      });
      const { json, res } = await expectJson(POST, req);
      expect(res.status).toBe(201);
      expect(json.invoiceNumber).toBeDefined();
    });

    it("returns 404 for missing medicine", async () => {
      prismaMock.medicine.findUnique.mockResolvedValue(null);
      const req = createRequest("/api/sales", {
        method: "POST",
        body: { items: [{ medicineId: "missing", quantity: 1 }], paymentMode: "cash", branchId: "b1", cashierId: "u1" },
      });
      const { res } = await expectStatus(POST, req, 404);
    });

    it("rejects insufficient stock", async () => {
      const { pickBatchFEFO } = await import("@/lib/inventory");
      (pickBatchFEFO as jest.Mock).mockRejectedValue(new Error("Insufficient stock"));
      prismaMock.medicine.findUnique.mockResolvedValue({ id: "m1", name: "Paracetamol", sellingPrice: 25, mrp: 30, gstRate: 5, scheduleType: null } as never);
      const req = createRequest("/api/sales", {
        method: "POST",
        body: { items: [{ medicineId: "m1", quantity: 999 }], paymentMode: "cash", branchId: "b1", cashierId: "u1" },
      });
      const { res } = await expectStatus(POST, req, 400);
    });

    it("applies per-item discount to line total and GST", async () => {
      const { pickBatchFEFO } = await import("@/lib/inventory");
      (pickBatchFEFO as jest.Mock).mockResolvedValue([{ batchId: "b1", batchNumber: "B-001", pickQty: 2, remainingQty: 0 }]);
      prismaMock.medicine.findUnique.mockResolvedValue({ id: "m1", name: "Paracetamol", sellingPrice: 25, mrp: 30, gstRate: 5, scheduleType: null } as never);
      prismaMock.$transaction = jest.fn((fn: (tx: typeof prismaMock) => unknown) => fn(prismaMock)) as never;
      prismaMock.sale.create.mockResolvedValue({ id: "s1", invoiceNumber: "INV-001", items: [], patient: {} } as never);
      prismaMock.invoiceCounter.upsert.mockResolvedValue({ prefix: "INV", counter: 1 } as never);
      prismaMock.auditLog.create.mockResolvedValue({} as never);

      const req = createRequest("/api/sales", {
        method: "POST",
        body: { items: [{ medicineId: "m1", quantity: 2, discountAmount: 10 }], paymentMode: "cash", branchId: "b1", cashierId: "u1" },
      });
      const { res } = await expectStatus(POST, req, 201);
      const createData = prismaMock.sale.create.mock.calls[0][0].data;
      expect(createData.items.create[0].discountAmount).toBe(10);
      expect(createData.items.create[0].totalAmount).toBeCloseTo(42, 5);
      expect(createData.taxableAmount).toBeCloseTo(40, 5);
      expect(createData.totalAmount).toBeCloseTo(42, 5);
    });

    it("rejects per-item discount above line total", async () => {
      prismaMock.medicine.findUnique.mockResolvedValue({ id: "m1", name: "Paracetamol", sellingPrice: 25, mrp: 30, gstRate: 5, scheduleType: null } as never);
      const req = createRequest("/api/sales", {
        method: "POST",
        body: { items: [{ medicineId: "m1", quantity: 2, discountAmount: 999 }], paymentMode: "cash", branchId: "b1", cashierId: "u1" },
      });
      const { res } = await expectStatus(POST, req, 400);
    });

    it("backs out GST when taxInclusive setting is on", async () => {
      const { pickBatchFEFO } = await import("@/lib/inventory");
      (pickBatchFEFO as jest.Mock).mockResolvedValue([{ batchId: "b1", batchNumber: "B-001", pickQty: 2, remainingQty: 0 }]);
      prismaMock.setting.findUnique.mockResolvedValue({ value: "true" } as never);
      prismaMock.medicine.findUnique.mockResolvedValue({ id: "m1", name: "Paracetamol", sellingPrice: 25, mrp: 30, gstRate: 5, scheduleType: null } as never);
      prismaMock.$transaction = jest.fn((fn: (tx: typeof prismaMock) => unknown) => fn(prismaMock)) as never;
      prismaMock.sale.create.mockResolvedValue({ id: "s1", invoiceNumber: "INV-001", items: [], patient: {} } as never);
      prismaMock.invoiceCounter.upsert.mockResolvedValue({ prefix: "INV", counter: 1 } as never);
      prismaMock.auditLog.create.mockResolvedValue({} as never);

      const req = createRequest("/api/sales", {
        method: "POST",
        body: { items: [{ medicineId: "m1", quantity: 2 }], paymentMode: "cash", branchId: "b1", cashierId: "u1" },
      });
      const { res } = await expectStatus(POST, req, 201);
      const createData = prismaMock.sale.create.mock.calls[0][0].data;
      expect(createData.totalAmount).toBeCloseTo(50, 5);
      expect(createData.taxableAmount).toBeCloseTo(50 / 1.05, 5);
      expect(createData.items.create[0].cgstAmount).toBeCloseTo((50 - 50 / 1.05) / 2, 5);
    });

    it("rejects credit sale without patient", async () => {
      const { pickBatchFEFO } = await import("@/lib/inventory");
      (pickBatchFEFO as jest.Mock).mockResolvedValue([{ batchId: "b1", batchNumber: "B-001", pickQty: 1, remainingQty: 0 }]);
      prismaMock.medicine.findUnique.mockResolvedValue({ id: "m1", name: "Paracetamol", sellingPrice: 25, mrp: 30, gstRate: 5, scheduleType: null } as never);
      prismaMock.$transaction = jest.fn((fn: (tx: typeof prismaMock) => unknown) => fn(prismaMock)) as never;
      const req = createRequest("/api/sales", {
        method: "POST",
        body: { items: [{ medicineId: "m1", quantity: 1 }], paymentMode: "credit", branchId: "b1", cashierId: "u1" },
      });
      const { res } = await expectStatus(POST, req, 400);
    });

    it("rejects credit sale when patient has no credit limit", async () => {
      const { pickBatchFEFO } = await import("@/lib/inventory");
      (pickBatchFEFO as jest.Mock).mockResolvedValue([{ batchId: "b1", batchNumber: "B-001", pickQty: 1, remainingQty: 0 }]);
      prismaMock.medicine.findUnique.mockResolvedValue({ id: "m1", name: "Paracetamol", sellingPrice: 25, mrp: 30, gstRate: 5, scheduleType: null } as never);
      prismaMock.patient.findUnique.mockResolvedValue({ id: "p1", creditLimit: 0 } as never);
      prismaMock.$transaction = jest.fn((fn: (tx: typeof prismaMock) => unknown) => fn(prismaMock)) as never;
      const req = createRequest("/api/sales", {
        method: "POST",
        body: { items: [{ medicineId: "m1", quantity: 1 }], patientId: "p1", paymentMode: "credit", branchId: "b1", cashierId: "u1" },
      });
      const { res } = await expectStatus(POST, req, 400);
    });

    it("rejects credit sale over the patient limit", async () => {
      const { pickBatchFEFO } = await import("@/lib/inventory");
      (pickBatchFEFO as jest.Mock).mockResolvedValue([{ batchId: "b1", batchNumber: "B-001", pickQty: 2, remainingQty: 0 }]);
      prismaMock.medicine.findUnique.mockResolvedValue({ id: "m1", name: "Paracetamol", sellingPrice: 25, mrp: 30, gstRate: 5, scheduleType: null } as never);
      prismaMock.patient.findUnique.mockResolvedValue({ id: "p1", creditLimit: 30 } as never);
      prismaMock.sale.aggregate.mockResolvedValue({ _sum: { finalAmount: 25 } } as never);
      prismaMock.$transaction = jest.fn((fn: (tx: typeof prismaMock) => unknown) => fn(prismaMock)) as never;
      const req = createRequest("/api/sales", {
        method: "POST",
        body: { items: [{ medicineId: "m1", quantity: 2 }], patientId: "p1", paymentMode: "credit", branchId: "b1", cashierId: "u1" },
      });
      const { res } = await expectStatus(POST, req, 400);
    });

    it("allows credit sale within the patient limit", async () => {
      const { pickBatchFEFO } = await import("@/lib/inventory");
      (pickBatchFEFO as jest.Mock).mockResolvedValue([{ batchId: "b1", batchNumber: "B-001", pickQty: 1, remainingQty: 0 }]);
      prismaMock.medicine.findUnique.mockResolvedValue({ id: "m1", name: "Paracetamol", sellingPrice: 25, mrp: 30, gstRate: 5, scheduleType: null } as never);
      prismaMock.patient.findUnique.mockResolvedValue({ id: "p1", creditLimit: 100 } as never);
      prismaMock.sale.aggregate.mockResolvedValue({ _sum: { finalAmount: 25 } } as never);
      prismaMock.$transaction = jest.fn((fn: (tx: typeof prismaMock) => unknown) => fn(prismaMock)) as never;
      prismaMock.sale.create.mockResolvedValue({ id: "s1", invoiceNumber: "INV-001", items: [], patient: {} } as never);
      prismaMock.invoiceCounter.upsert.mockResolvedValue({ prefix: "INV", counter: 1 } as never);
      prismaMock.auditLog.create.mockResolvedValue({} as never);
      const req = createRequest("/api/sales", {
        method: "POST",
        body: { items: [{ medicineId: "m1", quantity: 1 }], patientId: "p1", paymentMode: "credit", branchId: "b1", cashierId: "u1" },
      });
      const { res } = await expectStatus(POST, req, 201);
    });

    it("requires prescription for Schedule H medicines", async () => {      prismaMock.medicine.findUnique.mockResolvedValue({ id: "m1", name: "Amoxicillin", sellingPrice: 120, mrp: 150, gstRate: 12, scheduleType: "H" } as never);
      prismaMock.batch.findMany.mockResolvedValue([{ id: "b1", batchNumber: "B-001", quantity: 50, expiryDate: new Date("2027-01-01") }] as never);
      const { pickBatchFEFO } = await import("@/lib/inventory");
      (pickBatchFEFO as jest.Mock).mockResolvedValue([{ batchId: "b1", batchNumber: "B-001", pickQty: 10, remainingQty: 0 }]);
      const req = createRequest("/api/sales", {
        method: "POST",
        body: { items: [{ medicineId: "m1", quantity: 1 }], paymentMode: "cash", branchId: "b1", cashierId: "u1" },
      });
      const { res } = await expectStatus(POST, req, 422);
    });
  });
});
