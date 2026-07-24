-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_online_order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "medicine_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "total_amount" REAL NOT NULL,
    CONSTRAINT "online_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "online_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "online_order_items_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_online_order_items" ("id", "medicine_id", "order_id", "quantity", "total_amount", "unitPrice") SELECT "id", "medicine_id", "order_id", "quantity", "total_amount", "unitPrice" FROM "online_order_items";
DROP TABLE "online_order_items";
ALTER TABLE "new_online_order_items" RENAME TO "online_order_items";
CREATE TABLE "new_subscription_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscription_id" TEXT NOT NULL,
    "medicine_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    CONSTRAINT "subscription_items_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "subscription_items_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_subscription_items" ("id", "medicine_id", "quantity", "subscription_id", "unitPrice") SELECT "id", "medicine_id", "quantity", "subscription_id", "unitPrice" FROM "subscription_items";
DROP TABLE "subscription_items";
ALTER TABLE "new_subscription_items" RENAME TO "subscription_items";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
