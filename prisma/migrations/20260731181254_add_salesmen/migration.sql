-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "salesman_id" TEXT;

-- CreateTable
CREATE TABLE "salesmen" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salesmen_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_salesman_id_fkey" FOREIGN KEY ("salesman_id") REFERENCES "salesmen"("id") ON DELETE SET NULL ON UPDATE CASCADE;
