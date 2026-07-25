import { GET, PUT } from "@/app/api/settings/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson } from "../helpers";

describe("Settings API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists all settings", async () => {
    prismaMock.setting.findMany.mockResolvedValue([{ key: "store_name", value: "My Pharmacy", category: "GENERAL" }] as never);
    const { json } = await expectJson(GET, createRequest("/api/settings"));
    expect(json.settings).toHaveLength(1);
  });

  it("upserts a setting", async () => {
    prismaMock.setting.upsert.mockResolvedValue({ key: "currency", value: "INR" } as never);
    const req = createRequest("/api/settings", { method: "PUT", body: { key: "currency", value: "INR", category: "GENERAL" } });
    const { json } = await expectJson(PUT, req);
    expect(json.key).toBe("currency");
  });
});
