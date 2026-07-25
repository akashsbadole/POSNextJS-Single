import { GET, POST } from "@/app/api/custom-field-values/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../helpers";

describe("Custom Field Values API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("fetches values for an entity", async () => {
    prismaMock.customFieldValue.findMany.mockResolvedValue([{ id: "v1", value: "175", field: { fieldName: "Height" } }] as never);
    const { json } = await expectJson(GET, createRequest("/api/custom-field-values?entityType=PATIENT&entityId=p1"));
    expect(json.values).toHaveLength(1);
    expect(json.mapped.Height).toBe("175");
  });

  it("returns 400 without entityType or entityId", async () => {
    const { res } = await expectStatus(GET, createRequest("/api/custom-field-values"), 400);
  });

  it("upserts values", async () => {
    prismaMock.customFieldDefinition.findUnique.mockResolvedValue({ id: "f1" } as never);
    prismaMock.customFieldValue.upsert.mockResolvedValue({ id: "v1" } as never);
    const { json } = await expectJson(POST, createRequest("/api/custom-field-values", { method: "POST", body: { entityType: "PATIENT", entityId: "p1", values: { Height: "175" } } }));
    expect(json.success).toBe(true);
    expect(json.count).toBe(1);
  });

  it("skips unknown field names", async () => {
    prismaMock.customFieldDefinition.findUnique.mockResolvedValue(null);
    const { json } = await expectJson(POST, createRequest("/api/custom-field-values", { method: "POST", body: { entityType: "PATIENT", entityId: "p1", values: { UnknownField: "x" } } }));
    expect(json.count).toBe(0);
  });
});
