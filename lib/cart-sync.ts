const API = "/api/cart";

export type CartItem = { medicineId: string; quantity: number };

export async function fetchServerCart(): Promise<{ medicineId: string; quantity: number }[]> {
  try {
    const res = await fetch(API);
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function upsertCartItem(medicineId: string, quantity: number) {
  await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ medicineId, quantity }),
  });
}

export async function removeCartItem(medicineId: string) {
  await fetch(`${API}/${medicineId}`, { method: "DELETE" });
}

export async function clearServerCart() {
  await fetch(API, { method: "DELETE" });
}

export function getLocalCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch { return []; }
}

export function setLocalCart(items: CartItem[]) {
  localStorage.setItem("cart", JSON.stringify(items));
}

export function mergeCarts(local: CartItem[], server: CartItem[]): CartItem[] {
  const map = new Map<string, number>();
  for (const item of server) map.set(item.medicineId, item.quantity);
  for (const item of local) if (!map.has(item.medicineId)) map.set(item.medicineId, item.quantity);
  return Array.from(map.entries()).map(([medicineId, quantity]) => ({ medicineId, quantity }));
}
