import { GET as getMedicines } from "@/app/api/medicines/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectStatus, setRole, setUnauthenticated } from "../helpers";

const protectedRoutes = [
  ["medicines", getMedicines, createRequest("/api/medicines")],
] as const;

describe("Auth Guards", () => {
  beforeEach(() => {
    prismaMock.medicine.count.mockResolvedValue(0);
    prismaMock.medicine.findMany.mockResolvedValue([] as never);
  });

  it.each(protectedRoutes)("returns 401 for %s without auth", async (_name, handler, req) => {
    setUnauthenticated();
    await expectStatus(handler, req as never, 401);
  });

  it("allows access with valid session", async () => {
    setRole("OWNER");
    prismaMock.medicine.findMany.mockResolvedValue([] as never);
    prismaMock.medicine.count.mockResolvedValue(0);
    const { status } = await getMedicines(createRequest("/api/medicines"));
    expect(status).toBe(200);
  });
});
