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

let currentSession = { ...mockSession };

export function getServerSession() {
  return Promise.resolve(currentSession);
}

export function __setSession(session: typeof mockSession | null) {
  currentSession = session as typeof mockSession;
}

export const authOptions = {
  providers: [],
  session: { strategy: "jwt" as const },
  callbacks: {},
};

export default function NextAuth() {
  return { auth: jest.fn() };
}

export { mockSession };
