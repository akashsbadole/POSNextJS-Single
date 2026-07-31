import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import { authOptions } from "@/lib/auth";

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path === "/onboarding" || path === "/favicon.ico" || path.startsWith("/_next/")) {
      return NextResponse.next();
    }

    if (path.startsWith("/api/")) {
      return NextResponse.next();
    }

    const roleRoutes: Record<string, string[]> = {
      OWNER: ["/dashboard", "/inventory", "/prescriptions", "/pos", "/sales", "/purchases", "/reports", "/users", "/admin", "/online-store", "/subscriptions", "/analytics", "/telemedicine", "/accounting"],
      MANAGER: ["/dashboard", "/inventory", "/prescriptions", "/pos", "/sales", "/purchases", "/reports", "/online-store"],
      PHARMACIST: ["/dashboard", "/inventory", "/prescriptions", "/pos", "/sales"],
      CASHIER: ["/dashboard", "/pos", "/sales/invoices"],
    };

    const userRole = (token?.role as string) || "CASHIER";
    const allowedRoutes = roleRoutes[userRole] || [];

    const isAllowed = allowedRoutes.some((route) => path.startsWith(route));

    if (!isAllowed && path !== "/dashboard") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: authOptions.pages,
    callbacks: {
      authorized({ req, token }) {
        const path = req.nextUrl.pathname;
        if (path.startsWith("/api/auth")) return true;
        if (["/login", "/register", "/forgot-password", "/otp-verify", "/onboarding", "/reset-password"].includes(path)) return true;
        if (path.startsWith("/api/onboarding")) return true;
        // external callers authenticate via their own secret checks (cron, Razorpay, Meta)
        if (path.startsWith("/api/cron")) return true;
        if (path === "/api/whatsapp/webhook" || path === "/api/online-store/checkout/webhook") return true;
        return token !== null;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)"],
};
