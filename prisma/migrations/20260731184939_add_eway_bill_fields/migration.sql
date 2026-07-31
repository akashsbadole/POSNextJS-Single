-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "distance_km" INTEGER,
ADD COLUMN     "eway_bill_expiry" TIMESTAMP(3),
ADD COLUMN     "eway_bill_no" TEXT,
ADD COLUMN     "transporter_name" TEXT,
ADD COLUMN     "transporter_vehicle_no" TEXT;
