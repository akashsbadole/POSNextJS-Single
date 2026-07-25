const mockSession = {
  user: {
    id: "test-user-id",
    name: "Test Owner",
    email: "owner@test.com",
    role: "OWNER",
    businessType: "RETAIL_PHARMACY",
    branchId: "branch-1",
  },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

let currentSession: typeof mockSession | null = { ...mockSession };
let currentStatus: "loading" | "authenticated" | "unauthenticated" = "authenticated";

export function useSession() {
  return { data: currentSession, status: currentStatus, update: jest.fn() };
}

export function signIn(_provider?: string, _options?: Record<string, unknown>) {
  return Promise.resolve({ ok: true, error: undefined });
}

export function signOut(_options?: { callbackUrl?: string }) {
  return Promise.resolve();
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return children;
}

export { mockSession };
