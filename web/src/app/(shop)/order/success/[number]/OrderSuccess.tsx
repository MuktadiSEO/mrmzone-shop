"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, PhoneCall } from "lucide-react";
import type { Order } from "@/lib/types";
import { readSession, writeSession } from "@/lib/storage";
import { track } from "@/lib/pixel";
import { money } from "@/lib/format";
import { useSettings } from "@/lib/settings-context";
import { LAST_ORDER_KEY } from "@/components/shop/CheckoutForm";
import { Container } from "@/components/shop/Section";
import { ButtonLink } from "@/components/ui/Button";

export function OrderSuccess({ number }: { number: string }) {
  const settings = useSettings();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const o = readSession<Order | null>(LAST_ORDER_KEY, null);
    if (o && o.number === number) {
      setOrder(o);
      const firedKey = `mrm_purchase_${o.number}`;
      if (!readSession<boolean>(firedKey, false)) {
        writeSession(firedKey, true);
        setTimeout(() => track("Purchase", { value: o.total, currency: "BDT", content_ids: o.items.map((i) => String(i.product_id)), content_type: "product", num_items: o.items.reduce((a, b) => a + b.quantity, 0) }), 500);
      }
    }
  }, [number]);

  return (
    <Container className="py-8">
      <div className="mx-auto max-w-xl rounded-3xl border border-line bg-white p-6 text-center shadow-card sm:p-10">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" aria-hidden="true" />
        <h1 className="mt-3 text-2xl font-bold">ধন্যবাদ! আপনার অর্ডার সম্পন্ন হয়েছে</h1>
        <p className="mt-2 text-muted">অর্ডার নম্বর</p>
        <p className="font-display text-2xl font-bold tracking-wide text-teal-dark">{number}</p>
        <p className="mx-auto mt-4 flex max-w-sm items-start gap-2 rounded-xl bg-teal-50 p-3 text-left text-sm text-navy">
          <PhoneCall className="mt-0.5 h-4 w-4 shrink-0 text-teal-dark" aria-hidden="true" />
          আমাদের প্রতিনিধি শীঘ্রই আপনাকে ফোন করে অর্ডারটি কনফার্ম করবেন। অনুগ্রহ করে ফোনটি কাছে রাখুন।
        </p>
        {order && (
          <div className="mt-5 rounded-2xl border border-line p-4 text-left text-sm">
            <ul className="space-y-1.5">
              {order.items.map((it, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>{it.name}{it.variant ? ` (${it.variant})` : ""} × {it.quantity}</span>
                  <span className="font-display font-medium text-navy">{money(it.total)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-line pt-3">
              <div className="flex justify-between"><dt>ডেলিভারি চার্জ</dt><dd className="font-display">{order.delivery_charge ? money(order.delivery_charge) : "ফ্রি"}</dd></div>
              {order.discount > 0 && <div className="flex justify-between"><dt>ছাড়</dt><dd className="font-display">−{money(order.discount)}</dd></div>}
              <div className="flex justify-between text-base font-bold text-navy"><dt>সর্বমোট (ক্যাশ অন ডেলিভারি)</dt><dd className="font-display">{money(order.total)}</dd></div>
            </dl>
            <p className="mt-3 text-muted">{order.customer_name} · <span className="font-display">{order.phone}</span><br />{order.address}</p>
          </div>
        )}
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <ButtonLink href={`/track-order?number=${encodeURIComponent(number)}`} variant="outline">অর্ডার ট্র্যাক করুন</ButtonLink>
          <ButtonLink href="/" variant="accent">আরও কেনাকাটা করুন</ButtonLink>
        </div>
        <p className="mt-4 text-xs text-muted">যেকোনো প্রয়োজনে কল করুন: <a href={`tel:${settings.phone}`} className="font-display font-semibold text-navy">{settings.phone}</a></p>
      </div>
    </Container>
  );
}
