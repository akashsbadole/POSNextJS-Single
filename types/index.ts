// User Types
export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: "OWNER" | "MANAGER" | "PHARMACIST" | "CASHIER" | "DELIVERY_AGENT" | "CUSTOMER";
  branchId: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  twoFactorEnabled: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

// Medicine Types
export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brandName: string | null;
  categoryId: string;
  hsnCode: string | null;
  gstRate: number;
  dosageForm: string | null;
  strength: string | null;
  mrp: number;
  purchasePrice: number;
  sellingPrice: number;
  supplierId: string | null;
  barcode: string | null;
  reorderLevel: number;
  reorderQuantity: number;
  isActive: boolean;
  isPrescriptionRequired: boolean;
  images: string[];
  category?: Category;
  supplier?: Supplier;
  inventories?: Inventory[];
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  parent?: Category;
  children?: Category[];
  isActive: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  rating: number | null;
  totalOrders: number;
  isActive: boolean;
}

export interface Inventory {
  id: string;
  medicineId: string;
  branchId: string;
  quantity: number;
  reservedQty: number;
  mrp: number | null;
  sellingPrice: number | null;
  medicine?: Medicine;
  branch?: Branch;
  batches?: Batch[];
}

export interface Batch {
  id: string;
  batchNumber: string;
  medicineId: string;
  inventoryId: string;
  quantity: number;
  manufacturedDate: Date | null;
  expiryDate: Date;
  purchasePrice: number;
  mrp: number;
}

// Branch Types
export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  isActive: boolean;
}

// Patient & Doctor Types
export interface Patient {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  dateOfBirth: Date | null;
  age: number | null;
  gender: string | null;
  bloodGroup: string | null;
  address: string | null;
  allergies: string[];
  chronicConditions: string[];
}

export interface Doctor {
  id: string;
  name: string;
  rmpNumber: string | null;
  specialty: string | null;
  clinicName: string | null;
  clinicAddress: string | null;
  phone: string | null;
  email: string | null;
  isVerified: boolean;
}

// Prescription Types
export interface Prescription {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  doctorId: string | null;
  imageUrl: string | null;
  ocrText: string | null;
  abdmId: string | null;
  ePrescriptionId: string | null;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "DISPENSED" | "PARTIALLY_DISPENSED";
  patient?: Patient;
  doctor?: Doctor;
  items?: PrescriptionItem[];
}

export interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  medicineName: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  quantity: number | null;
  instructions: string | null;
  isDispensed: boolean;
  dispensedQty: number;
}

// Sales Types
export interface Sale {
  id: string;
  invoiceNumber: string;
  branchId: string;
  patientId: string | null;
  prescriptionId: string | null;
  cashierId: string;
  subtotal: number;
  discountAmount: number;
  discountType: string | null;
  discountValue: number | null;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGst: number;
  totalAmount: number;
  roundOff: number;
  finalAmount: number;
  paymentMode: "CASH" | "CARD" | "UPI" | "CREDIT" | "WALLET" | "INSURANCE" | "COD";
  paymentStatus: "PENDING" | "PAID" | "PARTIALLY_PAID" | "REFUNDED" | "FAILED";
  isGstInvoice: boolean;
  eInvoiceId: string | null;
  loyaltyPointsEarned: number;
  loyaltyPointsUsed: number;
  loyaltyDiscount: number;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "RETURNED" | "PARTIALLY_RETURNED";
  items?: SaleItem[];
  patient?: Patient;
  cashier?: User;
}

export interface SaleItem {
  id: string;
  saleId: string;
  medicineId: string;
  batchNumber: string | null;
  quantity: number;
  unitPrice: number;
  mrp: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  discountAmount: number;
  totalAmount: number;
  returnedQty: number;
  medicine?: Medicine;
}

// Purchase Types
export interface PurchaseOrder {
  id: string;
  poNumber: string;
  branchId: string;
  supplierId: string;
  createdById: string;
  status: "DRAFT" | "SENT" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
  expectedDeliveryDate: Date | null;
  items?: PurchaseOrderItem[];
  supplier?: Supplier;
}

export interface PurchaseOrderItem {
  id: string;
  poId: string;
  medicineId: string;
  quantity: number;
  receivedQty: number;
  unitPrice: number;
  gstRate: number;
  totalAmount: number;
  medicine?: Medicine;
}

// Online Store Types
export interface OnlineOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  deliverySlot: string | null;
  deliveryDate: Date | null;
  trackingNumber: string | null;
  courierPartner: string | null;
  subtotal: number;
  deliveryCharge: number;
  discountAmount: number;
  totalAmount: number;
  paymentMode: string;
  paymentStatus: string;
  status: string;
  prescriptionId: string | null;
  prescriptionVerified: boolean;
  items?: OnlineOrderItem[];
}

export interface OnlineOrderItem {
  id: string;
  orderId: string;
  medicineId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
