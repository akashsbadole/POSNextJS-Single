import { GET, POST, PUT, DELETE } from "@/app/api/drug-licenses/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../helpers";

describe("Drug Licenses API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists licenses", async () => {
    prismaMock.drugLicense.findMany.mockResolvedValue([{ id: "dl1", licenseNumber: "DL-001", holderType: "RETAIL" }] as never);
    const { json } = await expectJson(GET, createRequest("/api/drug-licenses"));
    expect(json).toHaveLength(1);
  });

  it("creates a license", async () => {
    prismaMock.drugLicense.create.mockResolvedValue({ id: "dl1", licenseNumber: "DL-001" } as never);
    const { json, res } = await expectJson(POST, createRequest("/api/drug-licenses", { method: "POST", body: { licenseNumber: "DL-001", holderName: "My Pharmacy", holderType: "RETAIL", issueDate: "2026-01-01", expiryDate: "2027-01-01" } }));
    expect(res.status).toBe(201);
  });

  it("updates a license", async () => {
    prismaMock.drugLicense.update.mockResolvedValue({ id: "dl1", holderName: "Updated" } as never);
    const { json } = await expectJson(PUT, createRequest("/api/drug-licenses", { method: "PUT", body: { id: "dl1", holderName: "Updated" } }));
    expect(json.holderName).toBe("Updated");
  });

  it("soft-deletes a license", async () => {
    prismaMock.drugLicense.update.mockResolvedValue({} as never);
    const { json } = await expectJson(DELETE, createRequest("/api/drug-licenses?id=dl1", { method: "DELETE" }));
    expect(json.success).toBe(true);
  });

  it("returns 400 without id for delete", async () => {
    await expectStatus(DELETE, createRequest("/api/drug-licenses", { method: "DELETE" }), 400);
  });
});
