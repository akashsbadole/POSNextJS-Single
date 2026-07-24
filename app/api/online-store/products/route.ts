import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Online store product catalog = active medicines with stock.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "24");

    const where: Record<string, unknown> = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { genericName: { contains: search } },
      ];
    }
    if (category && category !== "all") {
      where.category = { name: category };
    }

    const [medicines, total] = await Promise.all([
      prisma.medicine.findMany({
        where,
        include: {
          category: true,
          inventories: { select: { quantity: true, branch: { select: { name: true } } } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.medicine.count({ where }),
    ]);

    const products = medicines.map((m) => {
      const stock = m.inventories.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0);
      const discount = m.mrp > 0 ? Math.round((1 - m.sellingPrice / m.mrp) * 100) : 0;
      return {
        id: m.id,
        name: m.name,
        genericName: m.genericName,
        category: m.category?.name || "Uncategorized",
        price: m.sellingPrice,
        mrp: m.mrp,
        discount,
        prescription: m.isPrescriptionRequired,
        image: "",
        stock,
      };
    });

    return NextResponse.json({ products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Error fetching store products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
