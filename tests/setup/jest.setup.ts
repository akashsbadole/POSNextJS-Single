import { prismaMock } from "./mocks/prisma";
import { NextResponse } from "./mocks/next-server";

jest.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

const defaultSession = {
  user: {
    id: "test-user-id",
    name: "Test Owner",
    email: "owner@test.com",
    role: "OWNER" as const,
    businessType: "RETAIL_PHARMACY" as const,
    branchId: "branch-1",
  },
};

const mockRequireAuth = jest.fn();

mockRequireAuth.mockResolvedValue(defaultSession);

jest.mock("@/lib/api-auth", () => ({
  requireAuth: mockRequireAuth,
  unauthorized: jest.fn(() =>
    NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  ),
}));

beforeEach(() => {
  mockRequireAuth.mockResolvedValue(defaultSession);
});

export { mockRequireAuth };
