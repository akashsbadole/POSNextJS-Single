import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import { authOptions } from "@/lib/auth";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Role-based access control
    const roleRoutes: Record<string, string[]> = {
      OWNER: ["/dashboard", "/inventory", "/prescriptions", "/pos", "/sales", "/purchases", "/reports", "/users", "/admin", "/online-store", "/subscriptions", "/analytics", "/telemedicine"],
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
        if (req.nextUrl.pathname.startsWith("/api/auth")) return true;
        if (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/register" || req.nextUrl.pathname === "/forgot-password" || req.nextUrl.pathname === "/otp-verify") return true;
        return token !== null;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)"],
};
