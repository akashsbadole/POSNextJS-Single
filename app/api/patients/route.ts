import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        include: { _count: { select: { prescriptions: true, sales: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.patient.count({ where }),
    ]);

    return NextResponse.json({ patients, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const patient = await prisma.patient.create({ data: body });
    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json({ error: "Failed to create patient" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "Patient ID required" }, { status: 400 });
    const patient = await prisma.patient.update({ where: { id }, data });
    return NextResponse.json(patient);
  } catch (error) {
    console.error("Error updating patient:", error);
    return NextResponse.json({ error: "Failed to update patient" }, { status: 500 });
  }
}
