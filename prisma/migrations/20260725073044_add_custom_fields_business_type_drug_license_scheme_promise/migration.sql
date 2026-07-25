-- AlterTable
ALTER TABLE "patients" ADD COLUMN "city" TEXT;
ALTER TABLE "patients" ADD COLUMN "gstin" TEXT;
ALTER TABLE "patients" ADD COLUMN "pincode" TEXT;
ALTER TABLE "patients" ADD COLUMN "state" TEXT;

-- CreateTable
CREATE TABLE "custom_field_definitions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity_type" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "field_type" TEXT NOT NULL,
    "options" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "placeholder" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "custom_field_values" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "custom_field_values_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "custom_field_definitions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "drug_licenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "license_type" TEXT NOT NULL,
    "license_number" TEXT NOT NULL,
    "holder_name" TEXT NOT NULL,
    "holder_type" TEXT NOT NULL,
    "holder_id" TEXT NOT NULL,
    "issuing_authority" TEXT,
    "issue_date" DATETIME,
    "expiry_date" DATETIME NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "schemes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scheme_type" TEXT NOT NULL,
    "conditions" TEXT,
    "rewards" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" DATETIME,
    "valid_to" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "promise_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT,
    "medicine_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "fulfilled_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "promise_orders_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_branches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "gstin" TEXT,
    "business_type" TEXT NOT NULL DEFAULT 'RETAIL_PHARMACY',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_branches" ("address", "city", "code", "created_at", "email", "gstin", "id", "is_active", "name", "phone", "pincode", "state", "updated_at") SELECT "address", "city", "code", "created_at", "email", "gstin", "id", "is_active", "name", "phone", "pincode", "state", "updated_at" FROM "branches";
DROP TABLE "branches";
ALTER TABLE "new_branches" RENAME TO "branches";
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_definitions_entity_type_field_name_key" ON "custom_field_definitions"("entity_type", "field_name");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_values_entity_type_entity_id_field_id_key" ON "custom_field_values"("entity_type", "entity_id", "field_id");

-- CreateIndex
CREATE INDEX "drug_licenses_holder_type_holder_id_idx" ON "drug_licenses"("holder_type", "holder_id");

-- CreateIndex
CREATE UNIQUE INDEX "drug_licenses_license_number_key" ON "drug_licenses"("license_number");
