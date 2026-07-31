// Scheme engine: evaluates active schemes against cart items.
// conditions/rewards are JSON; contract:
//   CASH_DISCOUNT: {minOrderValue} -> {percent}
//   BULK_DISCOUNT: {productIds[], minQty} -> {percent}        (per-line, min qty of that product)
//   COMBO:         {productIds[]} -> {percent}                (all combo products in cart)
//   FREE_GOODS:    {productId, minQty} -> {productId, qty}    (free units of reward product)

export interface SchemeInput {
  medicineId: string;
  quantity: number;
  price?: number;
}

export interface SchemeResult {
  freeGoods: { medicineId: string; quantity: number }[];
  linePcts: Map<string, number>;
  orderPct: number;
}

function parse(j: string | null): Record<string, unknown> | null {
  if (!j) return null;
  try {
    const v = JSON.parse(j);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export function evaluateSchemes(
  schemes: { schemeType: string; conditions: string | null; rewards: string | null }[],
  items: SchemeInput[],
): SchemeResult {
  const res: SchemeResult = { freeGoods: [], linePcts: new Map(), orderPct: 0 };
  const qtyOf = (id: string) => items.filter((i) => i.medicineId === id).reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.quantity * (i.price || 0), 0);
  const addPct = (m: Map<string, number>, key: string, pct: number) => {
    const prev = m.get(key) || 0;
    if (pct > prev) m.set(key, pct);
  };

  for (const s of schemes) {
    const c = parse(s.conditions);
    const r = parse(s.rewards);
    if (!c || !r) continue;
    const pct = num(r.percent);

    if (s.schemeType === "CASH_DISCOUNT" && subtotal >= num(c.minOrderValue)) {
      res.orderPct = Math.max(res.orderPct, pct);
    } else if (s.schemeType === "BULK_DISCOUNT") {
      for (const id of (c.productIds as string[]) || []) {
        if (qtyOf(id) >= num(c.minQty)) addPct(res.linePcts, id, pct);
      }
    } else if (s.schemeType === "COMBO") {
      const ids = (c.productIds as string[]) || [];
      if (ids.length > 0 && ids.every((id) => qtyOf(id) > 0)) {
        for (const id of ids) addPct(res.linePcts, id, pct);
      }
    } else if (s.schemeType === "FREE_GOODS" && qtyOf(String(c.productId)) >= num(c.minQty)) {
      res.freeGoods.push({ medicineId: String(r.productId), quantity: Math.max(1, Math.round(num(r.qty))) });
    }
  }
  return res;
}
