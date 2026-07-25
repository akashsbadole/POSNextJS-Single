import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        nextDeliveryDate: { lte: today },
      },
      include: { items: true, customer: true },
    });

    if (dueSubscriptions.length === 0) {
      return NextResponse.json({ created: 0, message: "No due subscriptions" });
    }

    const createdDeliveries: { subscriptionId: string; deliveryId: string }[] = [];
    const notifications: { userId: string; message: string }[] = [];

    for (const sub of dueSubscriptions) {
      const delivery = await prisma.subscriptionDelivery.create({
        data: {
          subscriptionId: sub.id,
          scheduledDate: sub.nextDeliveryDate,
          status: "SCHEDULED",
        },
      });

      createdDeliveries.push({ subscriptionId: sub.id, deliveryId: delivery.id });

      const nextDate = new Date(sub.nextDeliveryDate);
      switch (sub.frequency) {
        case "WEEKLY":
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case "MONTHLY":
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case "QUARTERLY":
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        default:
          nextDate.setMonth(nextDate.getMonth() + 1);
      }

      await prisma.subscription.update({
        where: { id: sub.id },
        data: { nextDeliveryDate: nextDate },
      });

      notifications.push({
        userId: sub.customerId,
        message: `Subscription "${sub.name}" delivery scheduled for ${sub.nextDeliveryDate.toLocaleDateString("en-IN")}`,
      });
    }

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications.map((n) => ({
          ...n,
          type: "SUBSCRIPTION",
          title: "Subscription Delivery Scheduled",
          channels: JSON.stringify(["email"]),
          entityType: "subscription",
        })),
      });
    }

    return NextResponse.json({
      created: createdDeliveries.length,
      deliveries: createdDeliveries,
    });
  } catch (error) {
    console.error("Error processing subscription deliveries:", error);
    return NextResponse.json({ error: "Failed to process deliveries" }, { status: 500 });
  }
}
