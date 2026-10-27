"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useSettings } from "@/lib/settings-context";
import { money, toBanglaDigits } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";
import { ButtonLink } from "@/components/ui/Button";
import { ProductImage } from "./ProductImage";

export function QtyStepper({ value, onChange, max, size = "sm" }: { value: number; onChange: (n: number) => void; max?: number | null; size?: "sm" | "md" }) {
  const h = size === "md" ? "h-11" : "h-8";
  const w = size === "md" ? "w-11" : "w-8";
  return (
    <div className={`inline-flex items-center rounded-xl border border-line bg-white ${h}`}>
      <button type="button" className={`grid ${h} ${w} place-items-center text-navy disabled:opacity-40`} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="পরিমাণ কমান">
        <Minus className="h-4 w-4" />
      </button>
      <span className="font-display min-w-8 text-center font-semibold text-navy" aria-live="polite">{value}</span>
      <button type="button" className={`grid ${h} ${w} place-items-center text-navy disabled:opacity-40`} onClick={() => onChange(value + 1)} disabled={!!max && value >= max} aria-label="পরিমাণ বাড়ান">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function CartLines({ compact = false }: { compact?: boolean }) {
  const { items, update, remove } = useCart();
  return (
    <ul className="divide-y divide-line">
      {items.map((it) => (
        <li key={it.key} className="flex gap-3 py-3">
          <Link href={`/product/${it.slug}`} className={compact ? "h-16 w-16 shrink-0" : "h-20 w-20 shrink-0"}>
            <ProductImage src={it.image} alt={it.name} seed={it.product_id} />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Link href={`/product/${it.slug}`} className="line-clamp-2 text-sm font-medium text-navy hover:text-teal-dark">{it.name}</Link>
            {it.variant && <span className="text-xs text-muted">{it.variant}</span>}
            <div className="mt-auto flex items-center justify-between gap-2">
              <QtyStepper value={it.quantity} onChange={(n) => update(it.key, n)} max={it.max} />
              <span className="font-display font-semibold text-navy">{money(it.price * it.quantity)}</span>
            </div>
          </div>
          <button type="button" onClick={() => remove(it.key)} className="self-start rounded-lg p-1.5 text-muted hover:bg-rose-50 hover:text-rose-600" aria-label={`${it.name} সরান`}>
            <Trash2 className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}

export function MiniCart() {
  const { open, setOpen, items, subtotal, count } = useCart();
  const settings = useSettings();
  const freeMin = settings.delivery.free_delivery_min_qty;
  const left = freeMin > 0 ? freeMin - count : 0;
  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      side="right"
      title={`আপনার কার্ট (${toBanglaDigits(count)})`}
      footer={
        items.length > 0 ? (
          <div className="flex w-full flex-col gap-2">
            <div className="flex items-center justify-between text-navy">
              <span>সাবটোটাল</span>
              <span className="font-display text-lg font-bold">{money(subtotal)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ButtonLink href="/cart" variant="outline" onClick={() => setOpen(false)}>কার্ট দেখুন</ButtonLink>
              <ButtonLink href="/checkout" variant="accent" onClick={() => setOpen(false)}>অর্ডার করুন</ButtonLink>
            </div>
          </div>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <ShoppingBag className="h-12 w-12 text-line" aria-hidden="true" />
          <p className="text-muted">আপনার কার্ট খালি</p>
          <ButtonLink href="/products" variant="accent" onClick={() => setOpen(false)}>শপিং শুরু করুন</ButtonLink>
        </div>
      ) : (
        <>
          {freeMin > 0 && (
            <p className="mb-1 rounded-xl bg-teal-50 px-3 py-2 text-sm text-teal-dark">
              {left > 0 ? <>আর মাত্র {toBanglaDigits(left)}টি পণ্য যোগ করলেই <b>ফ্রি ডেলিভারি!</b></> : <>🎉 আপনি <b>ফ্রি ডেলিভারি</b> পাচ্ছেন!</>}
            </p>
          )}
          <CartLines compact />
        </>
      )}
    </Modal>
  );
}
