import { GET } from "@/app/api/accounting/route";
import { POST as POST_JOURNAL } from "@/app/api/accounting/journal/route";
import { prismaMock, armLedgerMocks } from "../setup/mocks/prisma";
import { createRequest, expectJson, expectStatus, setRole } from "../helpers";

jest.mock("@/lib/utils", () => ({ generateInvoiceNumber: jest.fn(() => "JRN-1") }));

describe("Accounting reports API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    armLedgerMocks();
  });

  it("returns a trial balance from journal lines", async () => {
    prismaMock.journalLine.groupBy.mockResolvedValue([
      { accountId: "1010", _sum: { debit: 1000, credit: 0 } },
      { accountId: "4010", _sum: { debit: 0, credit: 1000 } },
    ] as never);
    prismaMock.ledgerAccount.findMany.mockResolvedValue([
      { id: "1010", code: "1010", name: "Cash in Hand", type: "ASSET" },
      { id: "4010", code: "4010", name: "Sales Revenue", type: "REVENUE" },
    ] as never);

    const { json } = await expectJson(GET, createRequest("/api/accounting?report=trial-balance"));
    expect(json.accounts).toHaveLength(2);
    expect(json.accounts[0]).toMatchObject({ code: "1010", debit: 1000, credit: -1000 });
  });

  it("lists ledger rows for an account", async () => {
    prismaMock.ledgerAccount.findUnique.mockResolvedValue({ id: "1010", code: "1010", name: "Cash", type: "ASSET" } as never);
    prismaMock.journalLine.findMany.mockResolvedValue([
      { journal: { entryNumber: "JRN-1", date: new Date("2026-08-01"), memo: "Sale" }, debit: 100, credit: 0 },
      { journal: { entryNumber: "JRN-2", date: new Date("2026-08-02"), memo: "Expense" }, debit: 0, credit: 30 },
    ] as never);

    const { json } = await expectJson(GET, createRequest("/api/accounting?report=ledger&account=1010"));
    expect(json.rows).toHaveLength(2);
    expect(json.closingBalance).toBe(70);
  });
});

describe("Manual journal API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    armLedgerMocks();
  });

  it("rejects non-owner roles", async () => {
    setRole("CASHIER");
    const req = createRequest("/api/accounting/journal", {
      method: "POST",
      body: { memo: "x", lines: [{ accountCode: "1010", debit: 10 }, { accountCode: "3010", credit: 10 }] },
    });
    const { res } = await expectStatus(POST_JOURNAL, req, 403);
  });

  it("posts a balanced manual entry for an owner", async () => {
    setRole("OWNER");
    prismaMock.journalEntry.create.mockImplementation(async ({ data }) => ({ id: "j1", ...data }) as never);
    prismaMock.$transaction = jest.fn((arg: unknown) =>
      (arg as (tx: typeof prismaMock) => unknown)(prismaMock),
    ) as never;

    const req = createRequest("/api/accounting/journal", {
      method: "POST",
      body: { memo: "Capital infusion", lines: [{ accountCode: "1010", debit: 1000 }, { accountCode: "3010", credit: 1000 }] },
    });
    const { json, res } = await expectJson(POST_JOURNAL, req);
    expect(res.status).toBe(201);
    expect(json.memo).toBe("Capital infusion");
  });

  it("rejects an unbalanced manual entry", async () => {
    setRole("OWNER");
    prismaMock.$transaction = jest.fn((arg: unknown) =>
      (arg as (tx: typeof prismaMock) => unknown)(prismaMock),
    ) as never;

    const req = createRequest("/api/accounting/journal", {
      method: "POST",
      body: { memo: "Broken", lines: [{ accountCode: "1010", debit: 100 }, { accountCode: "3010", credit: 90 }] },
    });
    const { res } = await expectStatus(POST_JOURNAL, req, 400);
  });
});
