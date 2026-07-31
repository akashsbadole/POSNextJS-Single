import { PATCH } from "@/app/api/purchases/[id]/route";
import { prismaMock, armLedgerMocks } from "../../setup/mocks/prisma";
import { createRequest, expectJson, setRole } from "../../helpers";

describe("Purchase PATCH (e-way bill)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    armLedgerMocks();
  });

  const po = { id: "po1", poNumber: "PO-001", status: "RECEIVED", branchId: "b1", supplierId: "s1" };
  const params = [{ params: Promise.resolve({ id: "po1" }) }];

  it("saves transporter and e-way bill details", async () => {
    prismaMock.purchaseOrder.findUnique.mockResolvedValue(po as never);
    prismaMock.purchaseOrder.update.mockResolvedValue({
      ...po, transporterName: "FastTrans", transporterVehicleNo: "MH-01-AB-1234", distanceKm: 45, ewayBillNo: "EW-999", ewayBillExpiry: new Date("2026-08-31"),
    } as never);

    const { json } = await expectJson(PATCH, createRequest("/api/purchases", {
      method: "PATCH",
      body: {
        action: "eway",
        transporterName: "FastTrans",
        transporterVehicleNo: "MH-01-AB-1234",
        distanceKm: 45,
        ewayBillNo: "EW-999",
        ewayBillExpiry: "2026-08-31",
      },
    }), params);
    expect(json.ewayBillNo).toBe("EW-999");
    expect(prismaMock.purchaseOrder.update).toBeCalledWith(
      expect.objectContaining({ where: { id: "po1" }, data: expect.objectContaining({ transporterName: "FastTrans", distanceKm: 45 }) }),
    );
  });

  it("rejects e-way update on a PO from another branch", async () => {
    setRole("MANAGER");
    prismaMock.purchaseOrder.findUnique.mockResolvedValue({ ...po, branchId: "other" } as never);
    const res = await PATCH(createRequest("/api/purchases", {
      method: "PATCH",
      body: { action: "eway", ewayBillNo: "EW-1" },
    }), { params: Promise.resolve({ id: "po1" }) } as never);
    expect(res.status).toBe(403);
  });
});
