import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const medicineSchema = z.object({
  name: z.string().min(1),
  genericName: z.string().min(1),
  brandName: z.string().optional(),
  categoryId: z.string(),
  hsnCode: z.string().optional(),
  gstRate: z.number().default(5),
  dosageForm: z.string().optional(),
  strength: z.string().optional(),
  mrp: z.number().positive(),
  purchasePrice: z.number().positive(),
  sellingPrice: z.number().positive(),
  supplierId: z.string().optional(),
  reorderLevel: z.number().default(10),
  reorderQuantity: z.number().default(50),
  isPrescriptionRequired: z.boolean().default(false),
  branchId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { genericName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "all") {
      where.categoryId = category;
    }

    if (status) {
      where.isActive = status === "active";
    }

    const [medicines, total] = await Promise.all([
      prisma.medicine.findMany({
        where,
        include: {
          category: true,
          supplier: true,
          inventories: {
            include: { batches: true, branch: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.medicine.count({ where }),
    ]);

    return NextResponse.json({
      medicines,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching medicines:", error);
    return NextResponse.json(
      { error: "Failed to fetch medicines" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = medicineSchema.parse(body);
    const { branchId, ...medicineData } = validated;

    const result = await prisma.$transaction(async (tx) => {
      const medicine = await tx.medicine.create({
        data: medicineData,
      });

      if (branchId) {
        await tx.inventory.create({
          data: {
            medicineId: medicine.id,
            branchId,
            quantity: 0,
          },
        });
      }

      return medicine;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating medicine:", error);
    return NextResponse.json(
      { error: "Failed to create medicine" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Medicine ID is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.medicine.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Medicine not found" },
        { status: 404 }
      );
    }

    const medicine = await prisma.medicine.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(medicine);
  } catch (error) {
    console.error("Error updating medicine:", error);
    return NextResponse.json(
      { error: "Failed to update medicine" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Medicine ID is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.medicine.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Medicine not found" },
        { status: 404 }
      );
    }

    await prisma.medicine.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting medicine:", error);
    return NextResponse.json(
      { error: "Failed to delete medicine" },
      { status: 500 }
    );
  }
}
