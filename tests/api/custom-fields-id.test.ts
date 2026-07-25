import { GET, PUT, DELETE } from "@/app/api/custom-fields/[id]/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../helpers";

const mockParams = { params: Promise.resolve({ id: "cf1" }) };

describe("Custom Fields [id] API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("fetches a field by id", async () => {
    prismaMock.customFieldDefinition.findUnique.mockResolvedValue({ id: "cf1", fieldName: "Reg No" } as never);
    const { json } = await expectJson(GET, createRequest("/api/custom-fields/cf1"), [mockParams]);
    expect(json.fieldName).toBe("Reg No");
  });

  it("returns 404 for missing field", async () => {
    prismaMock.customFieldDefinition.findUnique.mockResolvedValue(null);
    const { res } = await expectStatus(GET, createRequest("/api/custom-fields/cf1"), 404, [mockParams]);
  });

  it("updates a field", async () => {
    prismaMock.customFieldDefinition.update.mockResolvedValue({ id: "cf1", fieldName: "Updated" } as never);
    const { json } = await expectJson(PUT, createRequest("/api/custom-fields/cf1", { method: "PUT", body: { fieldName: "Updated" } }), [mockParams]);
    expect(json.fieldName).toBe("Updated");
  });

  it("deletes a field with cascade", async () => {
    prismaMock.customFieldDefinition.delete.mockResolvedValue({} as never);
    prismaMock.customFieldValue.deleteMany.mockResolvedValue({ count: 0 } as never);
    const { json } = await expectJson(DELETE, createRequest("/api/custom-fields/cf1", { method: "DELETE" }), [mockParams]);
    expect(json.success).toBe(true);
    expect(prismaMock.customFieldValue.deleteMany).toBeCalledWith({ where: { fieldId: "cf1" } });
  });
});
