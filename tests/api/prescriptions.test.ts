import { GET, POST, PATCH } from "@/app/api/prescriptions/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../helpers";

jest.mock("@/lib/utils", () => ({ generateInvoiceNumber: jest.fn(() => "RX-260701-00001") }));

describe("Prescriptions API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists prescriptions with pagination", async () => {
    prismaMock.prescription.findMany.mockResolvedValue([{ id: "rx1", prescriptionNumber: "RX-001", patient: {}, doctor: {}, items: [] }] as never);
    prismaMock.prescription.count.mockResolvedValue(1);
    const { json } = await expectJson(GET, createRequest("/api/prescriptions"));
    expect(json.prescriptions).toHaveLength(1);
  });

  it("filters by status", async () => {
    prismaMock.prescription.findMany.mockResolvedValue([] as never);
    prismaMock.prescription.count.mockResolvedValue(0);
    await expectJson(GET, createRequest("/api/prescriptions?status=PENDING"));
    expect(prismaMock.prescription.findMany).toBeCalledWith(
      expect.objectContaining({ where: { status: "PENDING" } }),
    );
  });

  it("creates a prescription", async () => {
    prismaMock.prescription.create.mockResolvedValue({ id: "rx1", prescriptionNumber: "RX-001", items: [], patient: {}, doctor: {} } as never);
    prismaMock.invoiceCounter.upsert.mockResolvedValue({ prefix: "RX", counter: 1 } as never);

    const { json, res } = await expectJson(POST, createRequest("/api/prescriptions", {
      method: "POST",
      body: { patientId: "p1", doctorId: "d1", createdById: "u1", items: [{ medicineName: "Amoxicillin", dosage: "500mg", frequency: "TDS", quantity: 10 }] },
    }));
    expect(res.status).toBe(201);
  });

  it("rejects missing patientId", async () => {
    const { res } = await expectStatus(POST, createRequest("/api/prescriptions", {
      method: "POST",
      body: { doctorId: "d1", items: [] },
    }), 400);
  });

  it("updates prescription status via PATCH", async () => {
    prismaMock.prescription.update.mockResolvedValue({ id: "rx1", status: "COMPLETED" } as never);
    const { json } = await expectJson(PATCH, createRequest("/api/prescriptions", {
      method: "PATCH",
      body: { id: "rx1", status: "COMPLETED" },
    }));
    expect(json.status).toBe("COMPLETED");
  });
});
