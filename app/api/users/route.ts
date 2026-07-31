import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true, name: true, email: true, phone: true, role: true, status: true,
          branch: { select: { name: true } },
          createdAt: true, lastLoginAt: true, twoFactorEnabled: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
    ]);

    return NextResponse.json({ users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Only owners can manage users" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { id, name, phone, status, branchId, role } = body;
    if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });
    if (status && !["ACTIVE", "SUSPENDED", "INACTIVE"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (role && !["OWNER", "MANAGER", "PHARMACIST", "CASHIER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    // whitelisted fields only; never return credentials to the client
    const user = await prisma.user.update({
      where: { id },
      data: { name, phone, status, branchId, role },
      select: {
        id: true, name: true, email: true, phone: true, role: true, status: true,
        branchId: true, twoFactorEnabled: true,
      },
    });
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
