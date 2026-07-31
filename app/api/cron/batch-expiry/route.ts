import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkCronSecret } from "@/lib/cron-auth";

export async function GET(req: NextRequest) {
  const auth = checkCronSecret(req);
  if (auth) return auth;
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");

    const alertDate = new Date();
    alertDate.setDate(alertDate.getDate() + days);

    const expiringBatches = await prisma.batch.findMany({
      where: {
        expiryDate: { lte: alertDate },
        quantity: { gt: 0 },
      },
      include: { medicine: true, inventory: { include: { branch: true } } },
    });

    const existingAlertIds = new Set(
      (await prisma.notification.findMany({
        where: { type: "EXPIRY", isRead: false },
        select: { message: true },
      })).map((n) => n.message)
    );

    const notifications = [];
    for (const batch of expiringBatches) {
      const message = `Batch ${batch.batchNumber} of ${batch.medicine.name} expires on ${new Date(batch.expiryDate).toLocaleDateString("en-IN")}`;
      if (!existingAlertIds.has(message)) {
        // ponytail: one notification per batch message; userId now a real user (branch managers), not branchId as before
        const recipients = await prisma.user.findMany({
          where: { branchId: batch.inventory.branchId, role: { in: ["MANAGER", "OWNER"] } },
          select: { id: true },
        });
        for (const recipient of recipients.length > 0 ? recipients : await prisma.user.findMany({ where: { role: "OWNER" }, select: { id: true } })) {
          notifications.push({
            userId: recipient.id,
            type: "EXPIRY",
            title: "Batch Expiry Alert",
            message,
            channels: JSON.stringify(["email"]),
            entityType: "batch",
            entityId: batch.id,
          });
        }
      }
    }

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    return NextResponse.json({
      created: notifications.length,
      totalExpiring: expiringBatches.length,
    });
  } catch (error) {
    console.error("Error generating batch expiry alerts:", error);
    return NextResponse.json({ error: "Failed to generate expiry alerts" }, { status: 500 });
  }
}
