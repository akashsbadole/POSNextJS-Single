import { GET, POST, PUT } from "@/app/api/patients/route";
import { prismaMock } from "../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus } from "../helpers";

describe("Patients API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists patients with pagination", async () => {
    prismaMock.patient.findMany.mockResolvedValue([{ id: "p1", name: "Rahul", _count: { prescriptions: 1, sales: 2 } }] as never);
    prismaMock.patient.count.mockResolvedValue(1);
    const { json } = await expectJson(GET, createRequest("/api/patients"));
    expect(json.patients).toHaveLength(1);
    expect(json.pagination).toBeDefined();
  });

  it("searches patients", async () => {
    prismaMock.patient.findMany.mockResolvedValue([] as never);
    prismaMock.patient.count.mockResolvedValue(0);
    const req = createRequest("/api/patients?search=Rahul");
    await expectJson(GET, req);
    expect(prismaMock.patient.findMany).toBeCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) }),
    );
  });

  it("creates a patient", async () => {
    prismaMock.patient.create.mockResolvedValue({ id: "p2", name: "Priya" } as never);
    const req = createRequest("/api/patients", { method: "POST", body: { name: "Priya", phone: "9876543210" } });
    const { json, res } = await expectJson(POST, req);
    expect(res.status).toBe(201);
  });

  it("updates a patient", async () => {
    prismaMock.patient.update.mockResolvedValue({ id: "p1", name: "Rahul Updated" } as never);
    const req = createRequest("/api/patients", { method: "PUT", body: { id: "p1", name: "Rahul Updated" } });
    const { json } = await expectJson(PUT, req);
    expect(json.name).toBe("Rahul Updated");
  });
});
