import { PrismaClient } from "@prisma/client";

type PrismaModels = {
  [K in keyof PrismaClient]: PrismaClient[K] extends {
    findUnique: (...args: never[]) => unknown;
  }
    ? K
    : never;
}[keyof PrismaClient];

type MockFn = jest.Mock<any, any>;

type MockModel = {
  findUnique: MockFn;
  findFirst: MockFn;
  findMany: MockFn;
  create: MockFn;
  createMany: MockFn;
  update: MockFn;
  updateMany: MockFn;
  upsert: MockFn;
  delete: MockFn;
  deleteMany: MockFn;
  count: MockFn;
  aggregate: MockFn;
  groupBy: MockFn;
};

type MockPrismaClient = {
  [K in Exclude<keyof PrismaClient, "$transaction">]: PrismaClient[K] extends { findMany: (...args: never[]) => unknown }
    ? MockModel
    : never;
} & { $transaction: MockFn };

function createModelMock(): MockModel {
  return {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  };
}

const modelNames = [
  "account", "session", "verificationToken", "invoiceCounter", "rateLimitEntry",
  "user", "branch", "medicine", "category", "supplier",
  "inventory", "batch", "stockTransfer", "stockTransferItem",
  "patient", "doctor", "prescription", "prescriptionItem",
  "sale", "saleItem", "payment", "saleReturn", "saleReturnItem",
  "purchaseOrder", "purchaseOrderItem", "gRN", "gRNItem", "supplierPayment",
  "onlineOrder", "onlineOrderItem",
  "subscription", "subscriptionItem", "subscriptionDelivery",
  "loyaltyPoint", "loyaltyTier",
  "auditLog", "notification", "setting", "expense",
  "customFieldDefinition", "customFieldValue",
  "drugLicense", "scheme", "promiseOrder",
  "cart", "cartItem",
] as const;

const prismaMock = {} as MockPrismaClient;

for (const name of modelNames) {
  (prismaMock as Record<string, unknown>)[name] = createModelMock();
}

prismaMock.$transaction = jest.fn((fn: (tx: MockPrismaClient) => unknown) =>
  fn(prismaMock),
) as unknown as MockFn;

export { prismaMock, createModelMock };
export type { MockPrismaClient };
