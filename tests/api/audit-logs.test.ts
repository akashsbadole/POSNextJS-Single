import { GET } from "@/app/api/audit-logs/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson } from "../helpers";

describe("Audit Logs API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists logs with pagination", async () => {
    prismaMock.auditLog.findMany.mockResolvedValue([{ id: "log1", action: "CREATE", entityType: "SALE", user: { name: "Admin", email: "admin@test.com" } }] as never);
    prismaMock.auditLog.count.mockResolvedValue(1);
    const { json } = await expectJson(GET, createRequest("/api/audit-logs"));
    expect(json.logs).toHaveLength(1);
    expect(json.pagination.total).toBe(1);
  });

  it("filters by entityType and action", async () => {
    prismaMock.auditLog.findMany.mockResolvedValue([] as never);
    prismaMock.auditLog.count.mockResolvedValue(0);
    await expectJson(GET, createRequest("/api/audit-logs?entityType=SALE&action=CREATE"));
    expect(prismaMock.auditLog.findMany).toBeCalledWith(
      expect.objectContaining({ where: { entityType: "SALE", action: "CREATE" } }),
    );
  });
});
