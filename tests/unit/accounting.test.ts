import { postJournal, CHART } from "@/lib/accounting";
import { prismaMock } from "../setup/mocks/prisma";

jest.mock("@/lib/utils", () => ({
  generateInvoiceNumber: jest.fn(() => "JRN-260801-00001"),
}));

const txMock = prismaMock as never;

function runTx(fn: (tx: typeof prismaMock) => unknown) {
  prismaMock.$transaction = jest.fn((arg: unknown) => {
    if (Array.isArray(arg)) return Promise.all(arg as Promise<unknown>[]);
    return (arg as (tx: typeof prismaMock) => unknown)(txMock);
  }) as never;
}

describe("accounting ledger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    runTx((tx) => tx);
    const byCode = new Map(CHART.map((a) => [a.code, { id: a.code, ...a }]));
    (txMock as typeof prismaMock).ledgerAccount.upsert.mockImplementation(async ({ where }: { where: { code: string } }) => byCode.get(where.code));
    (txMock as typeof prismaMock).ledgerAccount.findUnique.mockImplementation(async ({ where }: { where: { code?: string; id?: string } }) =>
      byCode.get(where.code || "") || (where.id ? byCode.get(where.id) : null)
    );
    (txMock as typeof prismaMock).journalEntry.findUnique.mockResolvedValue(null as never);
    (txMock as typeof prismaMock).journalEntry.create.mockImplementation(async ({ data }) => ({ id: "j1", ...data }) as never);
  });

  it("posts a balanced entry with seeded accounts", async () => {
    const entry = await postJournal(txMock, {
      memo: "Test sale",
      referenceType: "sale",
      referenceId: "s1",
      lines: [
        { accountCode: "1010", debit: 100 },
        { accountCode: "4010", credit: 100 },
      ],
    });
    expect(entry).toBeDefined();
    expect(entry.memo).toBe("Test sale");
  });

  it("rejects an unbalanced entry", async () => {
    await expect(postJournal(txMock, {
      memo: "Broken",
      lines: [
        { accountCode: "1010", debit: 100 },
        { accountCode: "4010", credit: 90 },
      ],
    })).rejects.toThrow("Unbalanced");
  });

  it("rejects an unknown account code", async () => {
    await expect(postJournal(txMock, {
      memo: "Bad account",
      lines: [
        { accountCode: "9999", debit: 100 },
        { accountCode: "4010", credit: 100 },
      ],
    })).rejects.toThrow("Unknown account");
  });

  it("is idempotent for the same reference", async () => {
    await postJournal(txMock, { memo: "A", referenceType: "sale", referenceId: "s1", lines: [{ accountCode: "1010", debit: 5 }, { accountCode: "4010", credit: 5 }] });
    prismaMock.journalEntry.findUnique.mockResolvedValue({ id: "existing" } as never);
    const second = await postJournal(txMock, { memo: "A", referenceType: "sale", referenceId: "s1", lines: [{ accountCode: "1010", debit: 5 }, { accountCode: "4010", credit: 5 }] });
    expect(second.id).toBe("existing");
    expect((prismaMock.journalEntry.create as jest.Mock)).toHaveBeenCalledTimes(1);
  });
});
