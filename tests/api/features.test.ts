import { GET } from "@/app/api/features/route";
import { createRequest, expectJson } from "../helpers";

jest.mock("@/lib/features", () => ({
  getFeaturesForBusinessType: jest.fn(() => ({
    pos: true, prescriptions: true, scheduleH: true, onlineStore: true,
    subscriptions: false, telemedicine: false, accounting: true, analytics: true,
    bulkPricing: false, creditManagement: true, salesmanManagement: false,
    stockTransfers: false, purchaseReturns: true,
  })),
}));

describe("Features API", () => {
  it("returns features for business type", async () => {
    const { json } = await expectJson(GET, createRequest("/api/features"));
    expect(json.pos).toBe(true);
    expect(json.analytics).toBe(true);
  });
});
