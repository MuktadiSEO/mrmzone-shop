"use client";

import { ShoppingBag } from "lucide-react";
import { useCart, deliveryCharge } from "@/lib/cart";
import { useSettings } from "@/lib/settings-context";
import { money, toBanglaDigits } from "@/lib/format";
import { Container } from "@/components/shop/Section";
import { CartLines } from "@/components/shop/MiniCart";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, Spinner } from "@/components/ui/misc";

export function CartView() {
  const { items, subtotal, count, ready, clear } = useCart();
  const settings = useSettings();
  if (!ready) return <Container className="py-16 text-center"><Spinner /></Container>;
  const inside = deliveryCharge("inside_dhaka", count, settings.delivery);
  return (
    <Container className="py-5">
      <h1 className="mb-4 text-xl font-bold sm:text-2xl">শপিং কার্ট</h1>
      {items.length === 0 ? (
        <EmptyState icon={<ShoppingBag className="h-7 w-7" />} title="আপনার কার্ট খালি" text="পছন্দের পণ্য কার্টে যোগ করুন।" action={<ButtonLink href="/products" variant="accent">শপিং শুরু করুন</ButtonLink>} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="rounded-2xl border border-line bg-white px-4">
            <CartLines />
            <div className="flex justify-end border-t border-line py-3">
              <button type="button" onClick={clear} className="text-sm text-muted hover:text-rose-600">কার্ট খালি করুন</button>
            </div>
          </div>
          <div className="space-y-3 rounded-2xl border border-line bg-white p-4 lg:sticky lg:top-36">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt>সাবটোটাল ({toBanglaDigits(count)}টি)</dt><dd className="font-display font-semibold text-navy">{money(subtotal)}</dd></div>
              <div className="flex justify-between"><dt>ডেলিভারি (ঢাকার ভিতরে)</dt><dd className="font-display text-navy">{inside === 0 ? "ফ্রি" : money(inside)}</dd></div>
            </dl>
            <p className="text-xs text-muted">ডেলিভারি চার্জ চেকআউটে এলাকা অনুযায়ী হিসাব হবে।</p>
            <ButtonLink href="/checkout" variant="accent" size="lg" className="w-full">চেকআউট করুন</ButtonLink>
            <ButtonLink href="/products" variant="outline" className="w-full">আরও কেনাকাটা করুন</ButtonLink>
          </div>
        </div>
      )}
    </Container>
  );
}
