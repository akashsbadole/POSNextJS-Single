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
            include: { batches: true },
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

    const medicine = await prisma.medicine.create({
      data: validated,
    });

    return NextResponse.json(medicine, { status: 201 });
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
