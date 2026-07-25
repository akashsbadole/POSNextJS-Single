import { POST } from "@/app/api/auth/forgot-password/route";
import { prismaMock } from "../../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../../helpers";

jest.mock("@/lib/utils", () => ({ generateInvoiceNumber: jest.fn(() => "RST-260701-00001") }));

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sends reset token for existing user", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "u1", email: "user@test.com" } as never);
    prismaMock.verificationToken.create.mockResolvedValue({} as never);
    prismaMock.invoiceCounter.upsert.mockResolvedValue({ prefix: "RST", counter: 1 } as never);
    const req = createRequest("/api/auth/forgot-password", { method: "POST", body: { email: "user@test.com" } });
    const { json } = await expectJson(POST, req);
    expect(json.success).toBe(true);
  });

  it("returns error for non-existing email", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const req = createRequest("/api/auth/forgot-password", { method: "POST", body: { email: "nonexistent@test.com" } });
    const { res } = await expectStatus(POST, req, 400);
    const json = await res.json();
    expect(json.error).toBe("User not found");
  });
});
