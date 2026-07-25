import { GET, POST, PUT, DELETE } from "@/app/api/custom-field-definitions/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../helpers";

describe("Custom Field Definitions API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists definitions", async () => {
    prismaMock.customFieldDefinition.findMany.mockResolvedValue([{ id: "d1", fieldName: "Height", entityType: "PATIENT" }] as never);
    const { json } = await expectJson(GET, createRequest("/api/custom-field-definitions"));
    expect(json).toHaveLength(1);
  });

  it("creates a definition with Zod validation", async () => {
    prismaMock.customFieldDefinition.create.mockResolvedValue({ id: "d1", fieldName: "Height", fieldType: "NUMBER" } as never);
    const { json, res } = await expectJson(POST, createRequest("/api/custom-field-definitions", { method: "POST", body: { entityType: "PATIENT", fieldName: "Height", fieldType: "NUMBER" } }));
    expect(res.status).toBe(201);
  });

  it("rejects invalid fieldType via Zod", async () => {
    const { res } = await expectStatus(POST, createRequest("/api/custom-field-definitions", { method: "POST", body: { entityType: "X", fieldName: "Bad", fieldType: "INVALID" } }), 400);
  });

  it("updates a definition", async () => {
    prismaMock.customFieldDefinition.findUnique.mockResolvedValue({ id: "d1" } as never);
    prismaMock.customFieldDefinition.update.mockResolvedValue({ id: "d1", fieldName: "Updated" } as never);
    const { json } = await expectJson(PUT, createRequest("/api/custom-field-definitions", { method: "PUT", body: { id: "d1", fieldName: "Updated" } }));
    expect(json.fieldName).toBe("Updated");
  });

  it("soft-deletes a definition", async () => {
    prismaMock.customFieldDefinition.findUnique.mockResolvedValue({ id: "d1" } as never);
    prismaMock.customFieldDefinition.update.mockResolvedValue({} as never);
    const { json } = await expectJson(DELETE, createRequest("/api/custom-field-definitions?id=d1", { method: "DELETE" }));
    expect(json.success).toBe(true);
  });

  it("returns 404 on update for missing id", async () => {
    prismaMock.customFieldDefinition.findUnique.mockResolvedValue(null);
    const { res } = await expectStatus(PUT, createRequest("/api/custom-field-definitions", { method: "PUT", body: { id: "missing", fieldName: "X" } }), 404);
  });
});
