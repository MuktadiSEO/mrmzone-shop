"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { adminApi } from "@/lib/api";
import { money } from "@/lib/format";
import type { AdminProduct, Paginated, ProductVariant } from "@/lib/types";
import { ProductImage } from "@/components/shop/ProductImage";
import { Spinner } from "@/components/ui/misc";

export interface PickedProduct {
  product: AdminProduct;
  variant: ProductVariant | null;
}

/** Search admin products and pick one (plus a variant when the product has variants). */
export function ProductPicker({ onPick, placeholder = "Search product by name or SKU…", autoFocus }: { onPick: (p: PickedProduct) => void; placeholder?: string; autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<AdminProduct | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await adminApi.get<Paginated<AdminProduct>>("/products", { search: q, per_page: 10 });
        setItems(r.data);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, open]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) { setOpen(false); setPending(null); } };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const choose = (p: AdminProduct) => {
    if (p.variants?.length) { setPending(p); return; }
    onPick({ product: p, variant: null });
    setOpen(false);
    setQ("");
  };

  return (
    <div ref={box} className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setPending(null); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        aria-label="Search product"
        autoFocus={autoFocus}
        className="h-10 w-full rounded-xl border border-line bg-white pr-3 pl-9 text-sm focus:border-teal focus:outline-none"
      />
      {open && (
        <div className="absolute z-30 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-line bg-white p-1 shadow-pop">
          {pending ? (
            <div className="p-2">
              <p className="mb-2 text-sm font-semibold text-navy">{pending.name} — choose variant</p>
              <ul className="grid gap-1">
                {pending.variants.map((v) => (
                  <li key={v.id}>
                    <button type="button" disabled={v.stock <= 0} onClick={() => { onPick({ product: pending, variant: v }); setPending(null); setOpen(false); setQ(""); }} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-surface disabled:opacity-40">
                      <span>{v.name}</span>
                      <span className="font-display text-xs text-muted">{money(v.price)} · stock {v.stock}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => setPending(null)} className="mt-1 text-xs text-teal-dark hover:underline">← back</button>
            </div>
          ) : loading && !items.length ? (
            <div className="p-3"><Spinner /></div>
          ) : items.length === 0 ? (
            <p className="p-3 text-sm text-muted">No products found</p>
          ) : (
            <ul>
              {items.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => choose(p)} className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-surface">
                    <span className="h-9 w-9 shrink-0"><ProductImage src={p.image} alt="" seed={p.id} categorySlug={p.category?.slug} rounded="rounded-lg" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-navy">{p.name}</span>
                      <span className="font-display text-xs text-muted">{money(p.final_price)} · stock {p.stock}{p.variants?.length ? ` · ${p.variants.length} variants` : ""}</span>
                    </span>
                    <Plus className="h-4 w-4 text-teal-dark" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
