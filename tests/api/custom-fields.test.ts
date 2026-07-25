import { GET, POST } from "@/app/api/custom-fields/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../helpers";

describe("Custom Fields API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists fields", async () => {
    prismaMock.customFieldDefinition.findMany.mockResolvedValue([{ id: "cf1", fieldName: "Reg No", entityType: "PATIENT" }] as never);
    const { json } = await expectJson(GET, createRequest("/api/custom-fields"));
    expect(json.fields).toHaveLength(1);
  });

  it("filters by entityType", async () => {
    prismaMock.customFieldDefinition.findMany.mockResolvedValue([] as never);
    await expectJson(GET, createRequest("/api/custom-fields?entityType=PATIENT"));
    expect(prismaMock.customFieldDefinition.findMany).toBeCalledWith(
      expect.objectContaining({ where: { entityType: "PATIENT" } }),
    );
  });

  it("creates a field", async () => {
    prismaMock.customFieldDefinition.create.mockResolvedValue({ id: "cf1", fieldName: "Reg No" } as never);
    const { json, res } = await expectJson(POST, createRequest("/api/custom-fields", { method: "POST", body: { entityType: "PATIENT", fieldName: "Reg No", fieldType: "TEXT" } }));
    expect(res.status).toBe(201);
  });

  it("rejects missing required fields", async () => {
    const { res } = await expectStatus(POST, createRequest("/api/custom-fields", { method: "POST", body: { fieldName: "No Type" } }), 400);
  });
});
