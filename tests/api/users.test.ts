import { GET, PUT } from "@/app/api/users/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../helpers";

describe("Users API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists users without passwords", async () => {
    prismaMock.user.findMany.mockResolvedValue([{ id: "u1", name: "Admin", email: "admin@test.com", password: "secret", role: "OWNER" }] as never);
    prismaMock.user.count.mockResolvedValue(1);
    const { json } = await expectJson(GET, createRequest("/api/users"));
    expect(json.users).toHaveLength(1);
  });

  it("updates whitelisted fields only", async () => {
    prismaMock.user.update.mockResolvedValue({ id: "u1", name: "Updated", role: "MANAGER" } as never);
    const req = createRequest("/api/users", { method: "PUT", body: { id: "u1", name: "Updated", role: "MANAGER", password: "hacked" } });
    const { json } = await expectJson(PUT, req);
    expect(prismaMock.user.update).toBeCalledWith(
      expect.objectContaining({ data: expect.not.objectContaining({ password: expect.any(String) }) }),
    );
  });

  it("returns 400 without id", async () => {
    const req = createRequest("/api/users", { method: "PUT", body: { name: "No ID" } });
    await expectStatus(PUT, req, 400);
  });
});
