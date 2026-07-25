import { DELETE } from "@/app/api/custom-field-values/[id]/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson } from "../helpers";

const mockParams = { params: Promise.resolve({ id: "v1" }) };

describe("Custom Field Values [id] API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("deletes a value", async () => {
    prismaMock.customFieldValue.delete.mockResolvedValue({} as never);
    const { json } = await expectJson(DELETE, createRequest("/api/custom-field-values/v1", { method: "DELETE" }), [mockParams]);
    expect(json.success).toBe(true);
  });
});
