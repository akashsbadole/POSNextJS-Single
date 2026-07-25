import { PrismaClient } from "@prisma/client";

type PrismaModels = {
  [K in keyof PrismaClient]: PrismaClient[K] extends {
    findUnique: (...args: never[]) => unknown;
  }
    ? K
    : never;
}[keyof PrismaClient];

type MockModel = {
  findUnique?: ReturnType<typeof jest.fn>;
  findFirst?: ReturnType<typeof jest.fn>;
  findMany?: ReturnType<typeof jest.fn>;
  create?: ReturnType<typeof jest.fn>;
  createMany?: ReturnType<typeof jest.fn>;
  update?: ReturnType<typeof jest.fn>;
  updateMany?: ReturnType<typeof jest.fn>;
  upsert?: ReturnType<typeof jest.fn>;
  delete?: ReturnType<typeof jest.fn>;
  deleteMany?: ReturnType<typeof jest.fn>;
  count?: ReturnType<typeof jest.fn>;
  aggregate?: ReturnType<typeof jest.fn>;
  groupBy?: ReturnType<typeof jest.fn>;
};

type MockPrismaClient = {
  [K in keyof PrismaClient]: PrismaClient[K] extends { $transaction: never }
    ? MockModel
    : never;
} & { $transaction: ReturnType<typeof jest.fn> };

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
] as const;

const prismaMock = {} as MockPrismaClient;

for (const name of modelNames) {
  (prismaMock as Record<string, unknown>)[name] = createModelMock();
}

prismaMock.$transaction = jest.fn((fn: (tx: MockPrismaClient) => unknown) =>
  fn(prismaMock),
) as unknown as ReturnType<typeof jest.fn>;

export { prismaMock, createModelMock };
export type { MockPrismaClient };
