import { NextRequest, NextResponse } from "next/server";
import { mockRequireAuth } from "./setup/jest.setup";

type RouteHandler = (...args: any[]) => Promise<{ status: number; json: () => Promise<any> }>;

export function createRequest(url: string, init?: { method?: string; body?: Record<string, unknown>; searchParams?: Record<string, string> }) {
  const fullUrl = new URL(url, "http://localhost:3000");
  if (init?.searchParams) {
    for (const [k, v] of Object.entries(init.searchParams)) {
      fullUrl.searchParams.set(k, v);
    }
  }
  const headers: Record<string, string> = { "content-type": "application/json" };
  const body = init?.body ? JSON.stringify(init.body) : undefined;
  return new NextRequest(fullUrl.toString(), { method: init?.method || "GET", headers, body });
}

export function setRole(role: string) {
  mockRequireAuth.mockResolvedValue({
    user: {
      id: "test-user-id",
      name: "Test User",
      email: "test@test.com",
      role,
      businessType: "RETAIL_PHARMACY",
      branchId: "branch-1",
    },
  });
}

export function setUnauthenticated() {
  mockRequireAuth.mockResolvedValue(null);
}

export async function expectStatus(handler: RouteHandler, req: NextRequest, status: number, extraArgs: unknown[] = []) {
  const res = await handler(req, ...extraArgs);
  expect(res.status).toBe(status);
  return { res };
}

export async function expectJson(handler: RouteHandler, req: NextRequest, extraArgs: unknown[] = []) {
  const res = await handler(req, ...extraArgs);
  const json: any = await res.json();
  return { res, json };
}
