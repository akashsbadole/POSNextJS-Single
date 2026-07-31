import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    if (session.user.role === "CASHIER") {
      return NextResponse.json({ error: "Cashiers cannot manage salesmen" }, { status: 403 });
    }
    const { id } = await params;
    const body = await req.json();
    const existing = await prisma.salesman.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Salesman not found" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body.phone === "string") data.phone = body.phone || null;
    if (body.commissionRate !== undefined) {
      const rate = Number(body.commissionRate);
      if (rate < 0 || rate > 100) return NextResponse.json({ error: "Commission rate must be between 0 and 100" }, { status: 400 });
      data.commissionRate = rate;
    }
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;

    const salesman = await prisma.salesman.update({ where: { id }, data });
    return NextResponse.json(salesman);
  } catch (error) {
    console.error("Error updating salesman:", error);
    return NextResponse.json({ error: "Failed to update salesman" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only owners and admins can delete salesmen" }, { status: 403 });
    }
    const { id } = await params;
    // deactivate instead of delete: historical sales keep their FK intact
    await prisma.salesman.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deactivating salesman:", error);
    return NextResponse.json({ error: "Failed to deactivate salesman" }, { status: 500 });
  }
}
