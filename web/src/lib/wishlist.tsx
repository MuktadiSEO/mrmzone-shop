"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi } from "./api";
import { readJSON, writeJSON } from "./storage";
import type { ProductCard } from "./types";
import { useCustomer } from "./customer-auth";

interface WishCtx {
  items: ProductCard[];
  has: (id: number) => boolean;
  toggle: (p: ProductCard) => void;
}

const KEY = "mrm_wishlist_v1";
const Ctx = createContext<WishCtx | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { token } = useCustomer();
  const [items, setItems] = useState<ProductCard[]>([]);

  useEffect(() => {
    setItems(readJSON<ProductCard[]>(KEY, []));
  }, []);

  useEffect(() => {
    if (!token) return;
    authApi.wishlist().then((r) => {
      if (Array.isArray(r.data)) {
        setItems(r.data);
        writeJSON(KEY, r.data);
      }
    }).catch(() => {});
  }, [token]);

  const has = useCallback((id: number) => items.some((i) => i.id === id), [items]);
  const toggle = useCallback((p: ProductCard) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === p.id);
      const next = exists ? prev.filter((i) => i.id !== p.id) : [...prev, p];
      writeJSON(KEY, next);
      if (token) (exists ? authApi.removeWishlist(p.id) : authApi.addWishlist(p.id)).catch(() => {});
      return next;
    });
  }, [token]);

  return <Ctx.Provider value={{ items, has, toggle }}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return c;
}
