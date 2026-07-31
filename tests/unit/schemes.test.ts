import { evaluateSchemes } from "@/lib/schemes";

const items = [
  { medicineId: "m1", quantity: 6, price: 100 },
  { medicineId: "m2", quantity: 1, price: 50 },
];

describe("evaluateSchemes", () => {
  it("applies BULK_DISCOUNT only when the product reaches minQty", () => {
    const res = evaluateSchemes(
      [{ schemeType: "BULK_DISCOUNT", conditions: JSON.stringify({ productIds: ["m1"], minQty: 5 }), rewards: JSON.stringify({ percent: 10 }) }],
      items,
    );
    expect(res.linePcts.get("m1")).toBe(10);
    const res2 = evaluateSchemes(
      [{ schemeType: "BULK_DISCOUNT", conditions: JSON.stringify({ productIds: ["m1"], minQty: 7 }), rewards: JSON.stringify({ percent: 10 }) }],
      items,
    );
    expect(res2.linePcts.has("m1")).toBe(false);
  });

  it("applies CASH_DISCOUNT to the order when min order value is met", () => {
    const res = evaluateSchemes(
      [{ schemeType: "CASH_DISCOUNT", conditions: JSON.stringify({ minOrderValue: 500 }), rewards: JSON.stringify({ percent: 5 }) }],
      items,
    );
    expect(res.orderPct).toBe(5);
    const res2 = evaluateSchemes(
      [{ schemeType: "CASH_DISCOUNT", conditions: JSON.stringify({ minOrderValue: 1000 }), rewards: JSON.stringify({ percent: 5 }) }],
      items,
    );
    expect(res2.orderPct).toBe(0);
  });

  it("applies COMBO discount only when all combo products are in cart", () => {
    const res = evaluateSchemes(
      [{ schemeType: "COMBO", conditions: JSON.stringify({ productIds: ["m1", "m2"] }), rewards: JSON.stringify({ percent: 15 }) }],
      items,
    );
    expect(res.linePcts.get("m1")).toBe(15);
    expect(res.linePcts.get("m2")).toBe(15);
    const res2 = evaluateSchemes(
      [{ schemeType: "COMBO", conditions: JSON.stringify({ productIds: ["m1", "m3"] }), rewards: JSON.stringify({ percent: 15 }) }],
      items,
    );
    expect(res2.linePcts.has("m1")).toBe(false);
  });

  it("grants FREE_GOODS units when the trigger qty is met", () => {
    const res = evaluateSchemes(
      [{ schemeType: "FREE_GOODS", conditions: JSON.stringify({ productId: "m1", minQty: 5 }), rewards: JSON.stringify({ productId: "m2", qty: 1 }) }],
      items,
    );
    expect(res.freeGoods).toEqual([{ medicineId: "m2", quantity: 1 }]);
    const res2 = evaluateSchemes(
      [{ schemeType: "FREE_GOODS", conditions: JSON.stringify({ productId: "m1", minQty: 10 }), rewards: JSON.stringify({ productId: "m2", qty: 1 }) }],
      items,
    );
    expect(res2.freeGoods).toHaveLength(0);
  });

  it("ignores schemes with malformed JSON", () => {
    const res = evaluateSchemes(
      [{ schemeType: "BULK_DISCOUNT", conditions: "{nope", rewards: "not json" }],
      items,
    );
    expect(res.linePcts.has("m1")).toBe(false);
    expect(res.orderPct).toBe(0);
  });
});
