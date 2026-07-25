import { GET, POST } from "@/app/api/onboarding/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson } from "../helpers";

describe("Onboarding API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns completed status", async () => {
    prismaMock.setting.findUnique.mockResolvedValue({ key: "onboarding_complete", value: "true" } as never);
    const { json } = await expectJson(GET, createRequest("/api/onboarding"));
    expect(json.completed).toBe(true);
  });

  it("returns false when not completed", async () => {
    prismaMock.setting.findUnique.mockResolvedValue(null);
    const { json } = await expectJson(GET, createRequest("/api/onboarding"));
    expect(json.completed).toBe(false);
  });

  it("completes onboarding", async () => {
    prismaMock.setting.upsert.mockResolvedValue({} as never);
    const req = createRequest("/api/onboarding", {
      method: "POST",
      body: { businessType: "RETAIL_PHARMACY", store_name: "My Pharmacy", gst_number: "27AABCU9603R1ZM" },
    });
    const { json } = await expectJson(POST, req);
    expect(json.success).toBe(true);
  });
});
