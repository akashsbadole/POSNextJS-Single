import { cn, formatCurrency, formatDate, formatDateTime, calculateGST, getExpiryStatus, debounce, generateInvoiceNumber } from "@/lib/utils";
import { prismaMock } from "../setup/mocks/prisma";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });
});

describe("formatCurrency", () => {
  it("formats INR", () => {
    expect(formatCurrency(100)).toContain("100");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toContain("0");
  });
});

describe("formatDate", () => {
  it("formats date string", () => {
    const result = formatDate("2026-07-01");
    expect(result).toContain("Jul");
  });

  it("formats Date object", () => {
    const result = formatDate(new Date(2026, 0, 1));
    expect(result).toContain("Jan");
  });
});

describe("formatDateTime", () => {
  it("includes time", () => {
    const result = formatDateTime(new Date(2026, 6, 1, 14, 30));
    expect(result).toMatch(/\d{2}/);
  });
});

describe("calculateGST", () => {
  it("splits evenly into cgst/sgst", () => {
    const result = calculateGST(100, 18);
    expect(result.cgst).toBe(9);
    expect(result.sgst).toBe(9);
    expect(result.total).toBe(18);
  });

  it("handles zero amount", () => {
    expect(calculateGST(0, 18).total).toBe(0);
  });

  it("handles 5% GST", () => {
    expect(calculateGST(200, 5).total).toBe(10);
  });

  it("handles 12% GST", () => {
    expect(calculateGST(250, 12).total).toBe(30);
  });
});

describe("getExpiryStatus", () => {
  beforeAll(() => { jest.useFakeTimers(); jest.setSystemTime(new Date("2026-07-01")); });
  afterAll(() => { jest.useRealTimers(); });

  it("returns expired for past dates", () => {
    expect(getExpiryStatus(new Date("2026-06-01")).status).toBe("expired");
  });

  it("returns critical for <=7 days", () => {
    expect(getExpiryStatus(new Date("2026-07-05")).status).toBe("critical");
  });

  it("returns warning for <=30 days", () => {
    expect(getExpiryStatus(new Date("2026-07-20")).status).toBe("warning");
  });

  it("returns safe for >30 days", () => {
    expect(getExpiryStatus(new Date("2026-09-01")).status).toBe("safe");
  });
});

describe("debounce", () => {
  it("delays execution", () => {
    jest.useFakeTimers();
    const fn = jest.fn();
    const debounced = debounce(fn, 100);
    debounced();
    expect(fn).not.toBeCalled();
    jest.advanceTimersByTime(100);
    expect(fn).toBeCalledTimes(1);
    jest.useRealTimers();
  });
});

describe("generateInvoiceNumber", () => {
  it("generates sequential invoice numbers", async () => {
    prismaMock.invoiceCounter.upsert
      .mockResolvedValueOnce({ prefix: "INV", counter: 1, id: "c1" })
      .mockResolvedValueOnce({ prefix: "INV", counter: 2, id: "c2" });
    const inv1 = await generateInvoiceNumber("INV");
    const inv2 = await generateInvoiceNumber("INV");
    expect(inv1).toContain("INV-");
    expect(inv2).toContain("INV-");
    expect(inv1).not.toBe(inv2);
  });
});
