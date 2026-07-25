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
      businessType: "RETAIL_PHARMACY",
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
      businessType: "RETAIL_PHARMACY",
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
      { key: "onboarding_complete", value: "true", category: "GENERAL" },
    ],
  });

  // Create non-admin users across roles
  const nonAdminUsers = await Promise.all([
    prisma.user.create({
      data: { name: "Manager Rao", email: "manager@pharmacypro.com", password: hashedPassword, phone: "9876543220", role: "MANAGER", branchId: mainBranch.id, emailVerified: new Date() },
    }),
    prisma.user.create({
      data: { name: "Pharmacist Khan", email: "pharmacist@pharmacypro.com", password: hashedPassword, phone: "9876543221", role: "PHARMACIST", branchId: mainBranch.id, emailVerified: new Date() },
    }),
    prisma.user.create({
      data: { name: "Cashier Das", email: "cashier@pharmacypro.com", password: hashedPassword, phone: "9876543222", role: "CASHIER", branchId: mainBranch.id, emailVerified: new Date() },
    }),
    prisma.user.create({
      data: { name: "Dadar Pharmacist", email: "dadar@pharmacypro.com", password: hashedPassword, phone: "9876543223", role: "PHARMACIST", branchId: branch2.id, emailVerified: new Date() },
    }),
  ]);

  const allUsers = [admin, ...nonAdminUsers];
  const cashiers = nonAdminUsers.filter((u) => u.role === "CASHIER" || u.role === "MANAGER");

  // Helper to compute GST like the app
  const calcGst = (amount: number, rate: number) => {
    const total = (amount * rate) / 100;
    return { cgst: total / 2, sgst: total / 2, total };
  };

  // Create demo sales with items + payments + audit logs
  const medicineList = await prisma.medicine.findMany();
  const patients = await prisma.patient.findMany();

  for (let i = 0; i < 12; i++) {
    const medicine = medicineList[i % medicineList.length];
    const qty = 1 + (i % 3);
    const itemTotal = medicine.sellingPrice * qty;
    const gst = calcGst(itemTotal, medicine.gstRate);
    const taxableAmount = itemTotal;
    const totalAmount = taxableAmount + gst.total;
    const finalAmount = Math.round(totalAmount);
    const cashier = cashiers[i % cashiers.length];
    const patient = patients[i % patients.length];
    const modes = ["cash", "card", "upi", "credit"];
    const mode = modes[i % modes.length];
    const created = new Date(Date.now() - (12 - i) * 24 * 60 * 60 * 1000);

    await prisma.sale.create({
      data: {
        invoiceNumber: `INV-SEED-${String(i + 1).padStart(4, "0")}`,
        branchId: mainBranch.id,
        patientId: patient.id,
        cashierId: cashier.id,
        subtotal: itemTotal,
        discountAmount: 0,
        taxableAmount,
        cgstAmount: gst.cgst,
        sgstAmount: gst.sgst,
        totalGst: gst.total,
        totalAmount,
        finalAmount,
        paymentMode: mode,
        paymentStatus: mode === "credit" ? "PENDING" : "PAID",
        status: "COMPLETED",
        createdAt: created,
        items: {
          create: [{
            medicineId: medicine.id,
            quantity: qty,
            unitPrice: medicine.sellingPrice,
            mrp: medicine.mrp,
            gstRate: medicine.gstRate,
            cgstAmount: gst.cgst,
            sgstAmount: gst.sgst,
            totalAmount: totalAmount,
          }],
        },
        payments: {
          create: [{
            amount: finalAmount,
            mode,
            status: mode === "credit" ? "PENDING" : "PAID",
          }],
        },
      },
    });

    // Decrement inventory to reflect the sale
    await prisma.inventory.updateMany({
      where: { medicineId: medicine.id, branchId: mainBranch.id },
      data: { quantity: { decrement: qty } },
    });

    await prisma.auditLog.create({
      data: {
        userId: cashier.id,
        action: "CREATE",
        entityType: "sale",
        entityId: `INV-SEED-${String(i + 1).padStart(4, "0")}`,
        createdAt: created,
      },
    });
  }

  // Create demo purchase orders + GRN
  const allSuppliers = await prisma.supplier.findMany();
  for (let i = 0; i < 3; i++) {
    const medicine = medicineList[(i + 1) % medicineList.length];
    const supplier = allSuppliers[i % allSuppliers.length];
    const qty = 100 + i * 50;
    const unitPrice = medicine.purchasePrice;
    const poTotal = qty * unitPrice;
    const gst = calcGst(poTotal, medicine.gstRate);
    const poNumber = `PO-SEED-${String(i + 1).padStart(4, "0")}`;
    const created = new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000);

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        branchId: mainBranch.id,
        supplierId: supplier.id,
        createdById: admin.id,
        status: "RECEIVED",
        subtotal: poTotal,
        taxableAmount: poTotal,
        cgstAmount: gst.cgst,
        sgstAmount: gst.sgst,
        totalAmount: poTotal + gst.total,
        createdAt: created,
        items: {
          create: [{
            medicineId: medicine.id,
            quantity: qty,
            receivedQty: qty,
            unitPrice,
            gstRate: medicine.gstRate,
            totalAmount: qty * unitPrice,
          }],
        },
      },
    });

    const grnNumber = `GRN-SEED-${String(i + 1).padStart(4, "0")}`;
    await prisma.gRN.create({
      data: {
        grnNumber,
        poId: po.id,
        receivedDate: new Date(created.getTime() + 2 * 24 * 60 * 60 * 1000),
        items: {
          create: [{
            medicineId: medicine.id,
            orderedQty: qty,
            receivedQty: qty,
            acceptedQty: qty,
            batchNumber: `BATCH-${String(i + 1).padStart(4, "0")}`,
            expiryDate: new Date(Date.now() + (180 + i * 30) * 24 * 60 * 60 * 1000),
            unitPrice,
          }],
        },
      },
    });

    await prisma.supplierPayment.create({
      data: { supplierId: supplier.id, amount: poTotal + gst.total, mode: "bank_transfer", notes: `Payment for ${poNumber}` },
    });
  }

  // Create demo prescriptions with items
  const doctors = await prisma.doctor.findMany();
  for (let i = 0; i < 4; i++) {
    const patient = patients[i % patients.length];
    const doctor = doctors[i % doctors.length];
    const rxNumber = `RX-SEED-${String(i + 1).padStart(4, "0")}`;
    const medicine = medicineList[(i + 2) % medicineList.length];
    const created = new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000);

    await prisma.prescription.create({
      data: {
        prescriptionNumber: rxNumber,
        patientId: patient.id,
        doctorId: doctor.id,
        createdById: admin.id,
        status: i % 2 === 0 ? "FULFILLED" : "PENDING",
        createdAt: created,
        items: {
          create: [{
            medicineName: medicine.name,
            dosage: "1-0-1",
            frequency: "Twice daily",
            duration: "5 days",
            quantity: 10,
            instructions: "After food",
            isDispensed: i % 2 === 0,
            dispensedQty: i % 2 === 0 ? 10 : 0,
          }],
        },
      },
    });
  }

  // Create demo online orders
  for (let i = 0; i < 3; i++) {
    const medicine = medicineList[(i + 3) % medicineList.length];
    const customer = allUsers[i % allUsers.length];
    const patient = patients[i % patients.length];
    const qty = 2;
    const orderTotal = medicine.sellingPrice * qty;
    const orderNumber = `ORD-SEED-${String(i + 1).padStart(4, "0")}`;

    await prisma.onlineOrder.create({
      data: {
        orderNumber,
        customerId: customer.id,
        shippingAddress: `${i + 1} Customer Lane`,
        shippingCity: "Mumbai",
        shippingState: "Maharashtra",
        shippingPincode: "400001",
        deliverySlot: "Morning",
        deliveryDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
        trackingNumber: `TRK${1000 + i}`,
        courierPartner: "PharmacyPro Express",
        subtotal: orderTotal,
        totalAmount: orderTotal,
        paymentMode: "prepaid",
        paymentStatus: "PAID",
        status: i === 0 ? "DELIVERED" : "OUT_FOR_DELIVERY",
        createdAt: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000),
        items: {
          create: [{ medicineId: medicine.id, quantity: qty, unitPrice: medicine.sellingPrice, totalAmount: orderTotal }],
        },
      },
    });
  }

  // Create demo subscriptions with deliveries
  for (let i = 0; i < 2; i++) {
    const medicine = medicineList[(i + 1) % medicineList.length];
    const customer = allUsers[(i + 1) % allUsers.length];
    const subNumber = `SUB-SEED-${String(i + 1).padStart(4, "0")}`;
    const qty = 1;
    const subTotal = medicine.sellingPrice * qty;

    const subscription = await prisma.subscription.create({
      data: {
        customerId: customer.id,
        name: `Monthly ${medicine.name}`,
        frequency: "MONTHLY",
        subtotal: subTotal,
        totalAmount: subTotal,
        status: "ACTIVE",
        nextDeliveryDate: new Date(Date.now() + (15 + i * 5) * 24 * 60 * 60 * 1000),
        items: {
          create: [{ medicineId: medicine.id, quantity: qty, unitPrice: medicine.sellingPrice }],
        },
      },
    });

    await prisma.subscriptionDelivery.createMany({
      data: [
        { subscriptionId: subscription.id, scheduledDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), status: "SCHEDULED" },
        { subscriptionId: subscription.id, scheduledDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), status: "SCHEDULED" },
      ],
    });
  }

  // A couple of notifications + extra audit logs
  await prisma.notification.createMany({
    data: [
      { userId: admin.id, type: "STOCK", title: "Low stock alert", message: "Amoxicillin 250mg is below reorder level", channels: "[]" },
      { userId: admin.id, type: "ORDER", title: "New online order", message: "ORD-SEED-0001 placed", channels: "[]" },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: "LOGIN", entityType: "user", entityId: admin.id, createdAt: new Date(Date.now() - 60 * 60 * 1000) },
      { userId: admin.id, action: "CREATE", entityType: "purchase", entityId: "PO-SEED-0001", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    ],
  });

  console.log("✅ Seed completed successfully!");
  console.log("📧 Admin login: admin@pharmacypro.com / admin123");
  console.log("📧 Other users: manager@pharmacypro.com / pharmacist@pharmacypro.com / cashier@pharmacypro.com (pass: admin123)");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
