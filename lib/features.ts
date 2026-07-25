import { useSession } from "next-auth/react";

export type BusinessType =
  | "RETAIL_PHARMACY"
  | "HOSPITAL_PHARMACY"
  | "CLINIC"
  | "WHOLESALE"
  | "DISTRIBUTOR"
  | "GENERAL_RETAIL";

export type FeatureFlag = {
  pos: boolean;
  prescriptions: boolean;
  scheduleH: boolean;
  onlineStore: boolean;
  subscriptions: boolean;
  telemedicine: boolean;
  accounting: boolean;
  analytics: boolean;
  bulkPricing: boolean;
  creditManagement: boolean;
  salesmanManagement: boolean;
  stockTransfers: boolean;
  purchaseReturns: boolean;
};

const FEATURES_BY_TYPE: Record<BusinessType, FeatureFlag> = {
  RETAIL_PHARMACY: {
    pos: true, prescriptions: true, scheduleH: true, onlineStore: true,
    subscriptions: true, telemedicine: false, accounting: true, analytics: true,
    bulkPricing: false, creditManagement: true, salesmanManagement: false,
    stockTransfers: false, purchaseReturns: true,
  },
  HOSPITAL_PHARMACY: {
    pos: true, prescriptions: true, scheduleH: true, onlineStore: false,
    subscriptions: false, telemedicine: false, accounting: true, analytics: true,
    bulkPricing: false, creditManagement: true, salesmanManagement: false,
    stockTransfers: false, purchaseReturns: true,
  },
  CLINIC: {
    pos: false, prescriptions: true, scheduleH: true, onlineStore: false,
    subscriptions: false, telemedicine: true, accounting: true, analytics: true,
    bulkPricing: false, creditManagement: false, salesmanManagement: false,
    stockTransfers: false, purchaseReturns: false,
  },
  WHOLESALE: {
    pos: false, prescriptions: false, scheduleH: true, onlineStore: true,
    subscriptions: false, telemedicine: false, accounting: true, analytics: true,
    bulkPricing: true, creditManagement: true, salesmanManagement: true,
    stockTransfers: true, purchaseReturns: true,
  },
  DISTRIBUTOR: {
    pos: false, prescriptions: false, scheduleH: true, onlineStore: true,
    subscriptions: false, telemedicine: false, accounting: true, analytics: true,
    bulkPricing: true, creditManagement: true, salesmanManagement: true,
    stockTransfers: true, purchaseReturns: true,
  },
  GENERAL_RETAIL: {
    pos: true, prescriptions: false, scheduleH: false, onlineStore: false,
    subscriptions: false, telemedicine: false, accounting: true, analytics: true,
    bulkPricing: false, creditManagement: false, salesmanManagement: false,
    stockTransfers: false, purchaseReturns: false,
  },
};

export function useFeatures(): FeatureFlag {
  const { data: session } = useSession();
  const businessType = (session?.user?.businessType || "RETAIL_PHARMACY") as BusinessType;
  return FEATURES_BY_TYPE[businessType] || FEATURES_BY_TYPE.RETAIL_PHARMACY;
}

export function getFeaturesForBusinessType(type: BusinessType): FeatureFlag {
  return FEATURES_BY_TYPE[type] || FEATURES_BY_TYPE.RETAIL_PHARMACY;
}

export const BUSINESS_TYPES: { value: BusinessType; label: string; description: string }[] = [
  { value: "RETAIL_PHARMACY", label: "Retail Pharmacy", description: "Full POS, prescriptions, compliance, stock management" },
  { value: "HOSPITAL_PHARMACY", label: "Hospital Pharmacy", description: "IP/OP billing, prescription management, schedule tracking" },
  { value: "CLINIC", label: "Clinic", description: "Prescriptions, telemedicine, patient management" },
  { value: "WHOLESALE", label: "Wholesale", description: "Bulk pricing, credit, salesman management, distribution" },
  { value: "DISTRIBUTOR", label: "Distributor", description: "Multi-tier distribution, ERP ordering, stock transfers" },
  { value: "GENERAL_RETAIL", label: "General Retail", description: "Simple POS + inventory, no prescription features" },
];

export const FEATURE_LABELS: Record<keyof FeatureFlag, string> = {
  pos: "Point of Sale",
  prescriptions: "Prescriptions",
  scheduleH: "Schedule H/H1 Compliance",
  onlineStore: "Online Store",
  subscriptions: "Subscriptions",
  telemedicine: "Telemedicine",
  accounting: "Accounting",
  analytics: "Analytics",
  bulkPricing: "Bulk Pricing",
  creditManagement: "Credit Management",
  salesmanManagement: "Salesman Management",
  stockTransfers: "Stock Transfers",
  purchaseReturns: "Purchase Returns",
};
