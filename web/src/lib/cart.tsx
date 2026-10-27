"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { readJSON, writeJSON } from "./storage";
import { track } from "./pixel";

export interface CartItem {
  key: string; // product_id:variant_id
  product_id: number;
  variant_id: number | null;
  slug: string;
  name: string;
  variant: string | null;
  image: string | null;
  price: number;
  quantity: number;
  max?: number | null;
}

interface CartCtx {
  items: CartItem[];
  ready: boolean;
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, "key" | "quantity"> & { quantity?: number }, opts?: { silent?: boolean }) => void;
  update: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const KEY = "mrm_cart_v1";
const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = readJSON<CartItem[]>(KEY, []);
    setItems(Array.isArray(saved) ? saved.filter((i) => i && i.product_id && i.quantity > 0) : []);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) writeJSON(KEY, items);
  }, [items, ready]);

  const add: CartCtx["add"] = useCallback((item, opts) => {
    const key = `${item.product_id}:${item.variant_id ?? 0}`;
    const qty = Math.max(1, item.quantity ?? 1);
    setItems((prev) => {
      const ex = prev.find((i) => i.key === key);
      if (ex) {
        const q = item.max ? Math.min(item.max, ex.quantity + qty) : ex.quantity + qty;
        return prev.map((i) => (i.key === key ? { ...i, quantity: q } : i));
      }
      return [...prev, { ...item, key, quantity: qty }];
    });
    track("AddToCart", { content_ids: [String(item.product_id)], content_type: "product", content_name: item.name, value: item.price * qty, num_items: qty });
    if (!opts?.silent) setOpen(true);
  }, []);

  const update = useCallback((key: string, quantity: number) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity: Math.max(1, i.max ? Math.min(i.max, quantity) : quantity) } : i)));
  }, []);
  const remove = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartCtx>(() => ({
    items, ready, open, setOpen, add, update, remove, clear,
    count: items.reduce((a, b) => a + b.quantity, 0),
    subtotal: items.reduce((a, b) => a + b.price * b.quantity, 0),
  }), [items, ready, open, add, update, remove, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside <CartProvider>");
  return c;
}

/** Delivery charge rules shared by cart, checkout and landing pages. */
export function deliveryCharge(area: "inside_dhaka" | "outside_dhaka", qty: number, d: { inside_dhaka: number; outside_dhaka: number; free_delivery_min_qty: number }) {
  if (d.free_delivery_min_qty > 0 && qty >= d.free_delivery_min_qty) return 0;
  return area === "inside_dhaka" ? d.inside_dhaka : d.outside_dhaka;
}
