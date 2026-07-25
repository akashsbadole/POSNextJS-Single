import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/utils";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        include: {
          patient: { select: { name: true } },
          doctor: { select: { name: true } },
          items: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.prescription.count({ where }),
    ]);

    return NextResponse.json({
      prescriptions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return NextResponse.json({ error: "Failed to fetch prescriptions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { patientId, doctorId, items, createdById, imageUrl, ocrText } = body;

    if (!patientId || !createdById) {
      return NextResponse.json({ error: "patientId and createdById are required" }, { status: 400 });
    }

    const prescription = await prisma.prescription.create({
      data: {
        prescriptionNumber: await generateInvoiceNumber("RX"),
        patientId,
        doctorId,
        createdById,
        status: "PENDING",
        imageUrl,
        ocrText,
        items: {
          create: (items || []).map((it: { medicineName: string; dosage?: string; frequency?: string; duration?: string; quantity?: number; instructions?: string }) => ({
            medicineName: it.medicineName,
            dosage: it.dosage,
            frequency: it.frequency,
            duration: it.duration,
            quantity: it.quantity,
            instructions: it.instructions,
          })),
        },
      },
      include: { items: true, patient: true, doctor: true },
    });

    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return NextResponse.json({ error: "Failed to create prescription" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id) return NextResponse.json({ error: "Prescription id required" }, { status: 400 });

    const prescription = await prisma.prescription.update({
      where: { id },
      data: status ? { status } : {},
    });

    return NextResponse.json(prescription);
  } catch (error) {
    console.error("Error updating prescription:", error);
    return NextResponse.json({ error: "Failed to update prescription" }, { status: 500 });
  }
}
