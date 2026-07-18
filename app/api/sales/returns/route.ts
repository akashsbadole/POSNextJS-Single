import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const [returns, total] = await Promise.all([
      prisma.saleReturn.findMany({
        include: {
          sale: { select: { invoiceNumber: true } },
          items: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.saleReturn.count(),
    ]);

    return NextResponse.json({ returns, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Error fetching returns:", error);
    return NextResponse.json({ error: "Failed to fetch returns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, ...returnData } = body;

    const saleReturn = await prisma.$transaction(async (tx) => {
      const ret = await tx.saleReturn.create({
        data: {
          ...returnData,
          returnNumber: generateInvoiceNumber("RMA"),
          items: {
            create: items,
          },
        },
        include: { items: true },
      });

      for (const item of items) {
        await tx.inventory.updateMany({
          where: { medicineId: item.medicineId },
          data: { quantity: { increment: item.quantity } },
        });
      }

      return ret;
    });

    return NextResponse.json(saleReturn, { status: 201 });
  } catch (error) {
    console.error("Error creating return:", error);
    return NextResponse.json({ error: "Failed to create return" }, { status: 500 });
  }
}
