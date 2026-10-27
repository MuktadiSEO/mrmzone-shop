"use client";

import { use, useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { useAdminQuery } from "@/lib/use-admin-query";
import { defaultSettings, shopApi } from "@/lib/api";
import { formatDate, money } from "@/lib/format";
import type { Order, StoreSettings } from "@/lib/types";
import { Logo, LogoMark } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Alert, Spinner } from "@/components/ui/misc";

type Size = "A4" | "A5" | "label";

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // GET /admin/orders/{id}/invoice → { data: Order } (store info comes from /settings)
  const { data, error } = useAdminQuery<{ data: Order }>(`/orders/${id}/invoice`);
  const [store, setStore] = useState<StoreSettings>(defaultSettings);
  const [size, setSize] = useState<Size>("A5");

  useEffect(() => {
    shopApi.settings().then((s) => s && setStore({ ...defaultSettings, ...s })).catch(() => {});
  }, []);

  if (error) return <div className="p-6"><Alert>{error}</Alert></div>;
  if (!data) return <div className="grid min-h-dvh place-items-center"><Spinner /></div>;
  const o = data.data;
  const pageCss = size === "label" ? "@page { size: 100mm 150mm; margin: 4mm; }" : `@page { size: ${size}; margin: 10mm; }`;

  return (
    <div className="min-h-dvh bg-surface py-6 print:bg-white print:py-0">
      <style>{pageCss}</style>
      <div className="no-print mx-auto mb-4 flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4">
        <div className="inline-flex rounded-xl border border-line bg-white p-1" role="group" aria-label="Paper size">
          {(["A4", "A5", "label"] as Size[]).map((s) => (
            <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(s)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${size === s ? "bg-navy text-white" : "text-navy"}`}>
              {s === "label" ? "Courier label (100×150)" : s}
            </button>
          ))}
        </div>
        <Button onClick={() => window.print()} icon={<Printer className="h-4 w-4" />}>Print</Button>
      </div>

      {size === "label" ? (
        <div className="mx-auto w-[100mm] rounded-lg border border-navy bg-white p-3 text-[11px] leading-snug text-navy print:rounded-none print:border-0">
          <div className="flex items-center justify-between border-b border-dashed border-navy pb-2">
            <span className="flex items-center gap-1.5"><LogoMark size={26} /><span className="font-display text-sm font-bold tracking-widest">MRM ZONE</span></span>
            <span className="font-display text-right font-bold">{o.number}</span>
          </div>
          <div className="py-2">
            <p className="text-[10px] uppercase text-muted">Deliver to</p>
            <p className="text-sm font-bold">{o.customer_name}</p>
            <p className="font-display text-base font-bold">{o.phone}</p>
            <p>{o.address}{o.district ? `, ${o.district}` : ""}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 border-y border-dashed border-navy py-2">
            <div><p className="text-[10px] uppercase text-muted">COD amount</p><p className="font-display text-xl font-bold">{money(o.total)}</p></div>
            <div><p className="text-[10px] uppercase text-muted">Courier</p><p className="font-bold capitalize">{o.courier ?? "—"}</p><p className="font-display">{o.tracking_code ?? o.consignment_id ?? ""}</p></div>
          </div>
          <p className="pt-2">{o.items.map((i) => `${i.name}${i.variant ? ` (${i.variant})` : ""} ×${i.quantity}`).join(", ")}</p>
          {o.note && <p className="mt-1 italic">Note: {o.note}</p>}
          <p className="mt-2 border-t border-dashed border-navy pt-1.5 text-center">From: {store.name} · {store.phone}</p>
        </div>
      ) : (
        <article className={`mx-auto bg-white text-navy shadow-card print:shadow-none ${size === "A4" ? "max-w-[210mm] p-10 text-sm" : "max-w-[148mm] p-6 text-[12px]"}`}>
          <header className="flex items-start justify-between gap-4 border-b-2 border-navy pb-4">
            <div>
              <Logo size={size === "A4" ? 46 : 38} />
              <p className="mt-2 text-xs text-ink">{store.address}<br />{store.phone} · mrmzone.shop</p>
            </div>
            <div className="text-right">
              <h1 className="font-display text-2xl font-bold tracking-wider">INVOICE</h1>
              <p className="font-display font-semibold">{o.number}</p>
              <p className="text-xs text-ink">{formatDate(o.created_at, true)}</p>
            </div>
          </header>
          <section className="grid grid-cols-2 gap-4 py-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-teal-dark uppercase">Bill to</p>
              <p className="font-semibold">{o.customer_name}</p>
              <p className="font-display">{o.phone}</p>
              <p className="text-ink">{o.address}{o.district ? `, ${o.district}` : ""}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold tracking-wide text-teal-dark uppercase">Payment</p>
              <p>Cash on Delivery</p>
              {o.courier && <p className="capitalize">Courier: {o.courier} {o.tracking_code ? `· ${o.tracking_code}` : ""}</p>}
              <p>Status: {o.status_label}</p>
            </div>
          </section>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-navy text-left text-white">
                <th className="px-2 py-1.5 font-semibold">#</th><th className="px-2 py-1.5 font-semibold">Item</th>
                <th className="px-2 py-1.5 text-right font-semibold">Price</th><th className="px-2 py-1.5 text-right font-semibold">Qty</th><th className="px-2 py-1.5 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {o.items.map((it, i) => (
                <tr key={i} className="border-b border-line">
                  <td className="px-2 py-1.5">{i + 1}</td>
                  <td className="px-2 py-1.5">{it.name}{it.variant ? <span className="text-ink"> ({it.variant})</span> : null}</td>
                  <td className="font-display px-2 py-1.5 text-right">{money(it.price)}</td>
                  <td className="font-display px-2 py-1.5 text-right">{it.quantity}</td>
                  <td className="font-display px-2 py-1.5 text-right">{money(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="mt-3 ml-auto w-60 space-y-1">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-display">{money(o.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd className="font-display">{money(o.delivery_charge)}</dd></div>
            {o.discount > 0 && <div className="flex justify-between"><dt>Discount</dt><dd className="font-display">−{money(o.discount)}</dd></div>}
            {o.advance_paid > 0 && <div className="flex justify-between"><dt>Advance</dt><dd className="font-display">−{money(o.advance_paid)}</dd></div>}
            <div className="flex justify-between border-t-2 border-navy pt-1 text-base font-bold"><dt>Total (COD)</dt><dd className="font-display">{money(o.total)}</dd></div>
          </dl>
          {o.note && <p className="mt-4 rounded bg-surface p-2 text-xs">Note: {o.note}</p>}
          <footer className="mt-8 border-t border-line pt-3 text-center text-xs text-ink">
            ধন্যবাদ MRM Zone থেকে কেনাকাটা করার জন্য! · প্রয়োজনের সবকিছু, এক জায়গায় · {store.phone}
          </footer>
        </article>
      )}
    </div>
  );
}
