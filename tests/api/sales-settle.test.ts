import { PATCH } from "@/app/api/sales/[id]/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectStatus, setRole } from "../helpers";

describe("Sale settle API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setRole("CASHIER");
  });

  it("marks a pending sale as paid", async () => {
    prismaMock.sale.findUnique.mockResolvedValue({ id: "s1", branchId: "branch-1", paymentStatus: "PENDING" } as never);
    prismaMock.sale.update.mockResolvedValue({ id: "s1", paymentStatus: "PAID" } as never);
    prismaMock.payment.updateMany.mockResolvedValue({ count: 1 } as never);
    prismaMock.auditLog.create.mockResolvedValue({} as never);
    prismaMock.$transaction = jest.fn((arg: unknown) => Array.isArray(arg) ? Promise.all(arg as Promise<unknown>[]) : (arg as (tx: typeof prismaMock) => unknown)(prismaMock)) as never;

    const req = createRequest("/api/sales/s1", { method: "PATCH", body: { action: "settle" } });
    const { res } = await expectStatus(PATCH, req, 200, [{ params: Promise.resolve({ id: "s1" }) }]);
    expect(prismaMock.sale.update).toBeCalledWith(expect.objectContaining({ data: { paymentStatus: "PAID" } }));
  });

  it("rejects settling an already paid sale", async () => {
    prismaMock.sale.findUnique.mockResolvedValue({ id: "s1", branchId: "branch-1", paymentStatus: "PAID" } as never);
    const req = createRequest("/api/sales/s1", { method: "PATCH", body: { action: "settle" } });
    const { res } = await expectStatus(PATCH, req, 400, [{ params: Promise.resolve({ id: "s1" }) }]);
  });

  it("rejects settling a sale from another branch", async () => {
    prismaMock.sale.findUnique.mockResolvedValue({ id: "s1", branchId: "other-branch", paymentStatus: "PENDING" } as never);
    const req = createRequest("/api/sales/s1", { method: "PATCH", body: { action: "settle" } });
    const { res } = await expectStatus(PATCH, req, 403, [{ params: Promise.resolve({ id: "s1" }) }]);
  });
});
