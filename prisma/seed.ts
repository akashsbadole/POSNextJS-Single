import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create branches
  const mainBranch = await prisma.branch.create({
    data: {
      name: "Main Branch",
      code: "MAIN001",
      address: "123 Pharmacy Street",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      phone: "+91 9876543210",
      email: "main@pharmacypro.com",
      gstin: "27AABCU9603R1ZM",
    },
  });

  const branch2 = await prisma.branch.create({
    data: {
      name: "Dadar Branch",
      code: "DAD001",
      address: "456 Dadar West",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400028",
      phone: "+91 9876543211",
      email: "dadar@pharmacypro.com",
      gstin: "27AABCU9603R1ZN",
    },
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@pharmacypro.com",
      password: hashedPassword,
      phone: "9876543210",
      role: "OWNER",
      branchId: mainBranch.id,
      emailVerified: new Date(),
    },
  });

  // Create categories
  const categories = await prisma.category.createMany({
    data: [
      { name: "Painkillers", description: "Analgesics and antipyretics" },
      { name: "Antibiotics", description: "Antibacterial medications" },
      { name: "Vitamins", description: "Vitamin supplements" },
      { name: "Antihistamines", description: "Allergy medications" },
      { name: "Diabetes", description: "Diabetes management" },
      { name: "Cardiac", description: "Heart medications" },
      { name: "Ayurvedic", description: "Traditional medicine" },
    ],
  });

  // Create suppliers
  const suppliers = await prisma.supplier.createMany({
    data: [
      { name: "MediCorp Pharma", contactPerson: "Rajesh Kumar", phone: "9876543210", email: "contact@medicorp.com", gstin: "27AABCU9603R1ZX" },
      { name: "PharmaPlus Ltd", contactPerson: "Priya Sharma", phone: "9876543211", email: "sales@pharmaplus.com", gstin: "27AABCU9603R1ZY" },
      { name: "HealthCare Distributors", contactPerson: "Amit Patel", phone: "9876543212", email: "info@healthcare.com", gstin: "27AABCU9603R1ZZ" },
    ],
  });

  // Create medicines
  const painkillerCategory = await prisma.category.findFirst({ where: { name: "Painkillers" } });
  const antibioticCategory = await prisma.category.findFirst({ where: { name: "Antibiotics" } });
  const vitaminCategory = await prisma.category.findFirst({ where: { name: "Vitamins" } });

  const medicines = await prisma.medicine.createMany({
    data: [
      {
        name: "Paracetamol 500mg",
        genericName: "Paracetamol",
        brandName: "Crocin",
        categoryId: painkillerCategory!.id,
        hsnCode: "3004",
        gstRate: 5.00,
        dosageForm: "Tablet",
        strength: "500mg",
        mrp: 30.00,
        purchasePrice: 20.00,
        sellingPrice: 25.50,
        reorderLevel: 50,
        reorderQuantity: 200,
        barcode: "8901234567890",
      },
      {
        name: "Amoxicillin 250mg",
        genericName: "Amoxicillin",
        brandName: "Mox",
        categoryId: antibioticCategory!.id,
        hsnCode: "3004",
        gstRate: 12.00,
        dosageForm: "Capsule",
        strength: "250mg",
        mrp: 150.00,
        purchasePrice: 100.00,
        sellingPrice: 120.00,
        reorderLevel: 30,
        reorderQuantity: 100,
        isPrescriptionRequired: true,
        barcode: "8901234567891",
      },
      {
        name: "Vitamin D3 60K",
        genericName: "Cholecalciferol",
        brandName: "D-Rise",
        categoryId: vitaminCategory!.id,
        hsnCode: "3004",
        gstRate: 5.00,
        dosageForm: "Capsule",
        strength: "60000 IU",
        mrp: 100.00,
        purchasePrice: 70.00,
        sellingPrice: 85.00,
        reorderLevel: 40,
        reorderQuantity: 150,
        barcode: "8901234567892",
      },
    ],
  });

  // Create inventory
  const paracetamol = await prisma.medicine.findFirst({ where: { name: "Paracetamol 500mg" } });
  const amoxicillin = await prisma.medicine.findFirst({ where: { name: "Amoxicillin 250mg" } });
  const vitaminD3 = await prisma.medicine.findFirst({ where: { name: "Vitamin D3 60K" } });

  await prisma.inventory.createMany({
    data: [
      { medicineId: paracetamol!.id, branchId: mainBranch.id, quantity: 150 },
      { medicineId: amoxicillin!.id, branchId: mainBranch.id, quantity: 45 },
      { medicineId: vitaminD3!.id, branchId: mainBranch.id, quantity: 200 },
      { medicineId: paracetamol!.id, branchId: branch2.id, quantity: 80 },
    ],
  });

  // Create patients
  await prisma.patient.createMany({
    data: [
      { name: "Rahul Sharma", phone: "9876543210", email: "rahul@email.com", age: 34, gender: "M", address: "123 Mumbai" },
      { name: "Priya Patel", phone: "9876543211", email: "priya@email.com", age: 28, gender: "F", address: "456 Mumbai" },
    ],
  });

  // Create doctors
  await prisma.doctor.createMany({
    data: [
      { name: "Dr. Rajesh Sharma", rmpNumber: "12345", specialty: "General Physician", clinicName: "City Health Care", phone: "9876543210" },
      { name: "Dr. Sneha Gupta", rmpNumber: "12346", specialty: "Cardiologist", clinicName: "Heart Care Clinic", phone: "9876543211" },
    ],
  });

  // Create loyalty tiers
  await prisma.loyaltyTier.createMany({
    data: [
      { name: "Silver", minPoints: 0, maxPoints: 999, discountPercent: 2.00 },
      { name: "Gold", minPoints: 1000, maxPoints: 4999, discountPercent: 5.00 },
      { name: "Platinum", minPoints: 5000, discountPercent: 10.00 },
    ],
  });

  // Create settings
  await prisma.setting.createMany({
    data: [
      { key: "store_name", value: "PharmacyPro", category: "GENERAL" },
      { key: "gst_number", value: "27AABCU9603R1ZM", category: "TAX" },
      { key: "currency", value: "INR", category: "GENERAL" },
      { key: "low_stock_threshold", value: "10", category: "INVENTORY" },
      { key: "expiry_alert_days", value: "30", category: "INVENTORY" },
    ],
  });

  console.log("✅ Seed completed successfully!");
  console.log("📧 Admin login: admin@pharmacypro.com / admin123");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
