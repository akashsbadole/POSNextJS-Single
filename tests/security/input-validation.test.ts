import { POST } from "@/app/api/medicines/route";
import { POST as registerUser } from "@/app/api/auth/register/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectStatus } from "../helpers";

describe("Input Validation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects empty medicine name", async () => {
    const req = createRequest("/api/medicines", {
      method: "POST",
      body: { name: "", genericName: "", categoryId: "", mrp: -1, purchasePrice: -1, sellingPrice: -1 },
    });
    const { res } = await expectStatus(POST, req, 400);
    const json = await res.json();
    expect(json.error).toBe("Validation failed");
  });

  it("rejects invalid email in registration", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const req = createRequest("/api/auth/register", {
      method: "POST",
      body: { name: "Test", email: "not-an-email", phone: "9876543210", password: "short" },
    });
    const { res } = await expectStatus(registerUser, req, 400);
  });

  it("rejects short passwords", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const req = createRequest("/api/auth/register", {
      method: "POST",
      body: { name: "Test", email: "test@test.com", phone: "9876543210", password: "ab" },
    });
    const { res } = await expectStatus(registerUser, req, 400);
  });
});
