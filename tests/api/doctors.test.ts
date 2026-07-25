import { GET, POST, PUT } from "@/app/api/doctors/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus, setUnauthenticated } from "../helpers";

describe("Doctors API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists doctors", async () => {
    prismaMock.doctor.findMany.mockResolvedValue([{ id: "d1", name: "Dr. Sharma", specialty: "Cardiologist" }] as never);
    const { json } = await expectJson(GET, createRequest("/api/doctors"));
    expect(json).toHaveLength(1);
  });

  it("creates a doctor", async () => {
    prismaMock.doctor.create.mockResolvedValue({ id: "d2", name: "Dr. Gupta" } as never);
    const req = createRequest("/api/doctors", { method: "POST", body: { name: "Dr. Gupta", specialty: "General" } });
    const { json, res } = await expectJson(POST, req);
    expect(res.status).toBe(201);
  });

  it("updates a doctor", async () => {
    prismaMock.doctor.update.mockResolvedValue({ id: "d1", name: "Dr. Updated" } as never);
    const req = createRequest("/api/doctors", { method: "PUT", body: { id: "d1", name: "Dr. Updated" } });
    const { json } = await expectJson(PUT, req);
    expect(json.name).toBe("Dr. Updated");
  });

  it("returns 401 without auth", async () => {
    setUnauthenticated();
    await expectStatus(GET, createRequest("/api/doctors"), 401);
  });
});
