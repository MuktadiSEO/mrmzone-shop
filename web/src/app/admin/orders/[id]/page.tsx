"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { ArrowLeft, History, PhoneCall, Printer, RefreshCw, Save, Send, Trash2 } from "lucide-react";
import { adminApi, errorMessage } from "@/lib/api";
import { useAdminQuery } from "@/lib/use-admin-query";
import { BD_DISTRICTS, COURIERS, formatDate, money, normalizePhone, ORDER_STATUSES, STATUS_LABELS } from "@/lib/format";
import type { DeliveryArea, FraudCheck, Order, OrderItem, OrderStatus, Paginated, Staff, StoreSettings } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Alert, Spinner } from "@/components/ui/misc";
import { FraudCheckButton, RiskBadge, StatusBadge } from "@/components/admin/common";
import { CourierBadge } from "@/components/admin/order-bits";
import { ProductPicker } from "@/components/admin/ProductPicker";
import { QtyStepper } from "@/components/shop/MiniCart";
import { ProductImage } from "@/components/shop/ProductImage";
import { useToast } from "@/components/admin/Toast";
import { shopApi, defaultSettings } from "@/lib/api";

type EditItem = Pick<OrderItem, "product_id" | "variant_id" | "name" | "variant" | "image" | "price" | "quantity">;

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const toast = useToast();
  const { data, loading, error, reload } = useAdminQuery<{ data: Order }>(`/orders/${id}`);
  const staff = useAdminQuery<Paginated<Staff>>("/staff", { per_page: 100 });
  const [delivery, setDelivery] = useState<StoreSettings["delivery"]>(defaultSettings.delivery);
  const [o, setO] = useState<Order | null>(null);
  const [items, setItems] = useState<EditItem[]>([]);
  const [shipMode, setShipMode] = useState<"inside_dhaka" | "outside_dhaka" | "free" | "custom">("inside_dhaka");
  const [statusNote, setStatusNote] = useState("");
  const [courier, setCourier] = useState("steadfast");
  const [fraud, setFraud] = useState<FraudCheck | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    shopApi.settings().then((s) => s?.delivery && setDelivery(s.delivery)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!data?.data) return;
    const ord = data.data;
    setO(ord);
    setItems(ord.items.map((i) => ({ product_id: i.product_id, variant_id: i.variant_id, name: i.name, variant: i.variant, image: i.image, price: i.price, quantity: i.quantity })));
    setCourier(ord.courier ?? "steadfast");
    setShipMode(ord.delivery_charge === 0 ? "free" : ord.delivery_charge === delivery.inside_dhaka && ord.delivery_area === "inside_dhaka" ? "inside_dhaka" : ord.delivery_charge === delivery.outside_dhaka ? "outside_dhaka" : "custom");
    adminApi.get<{ data: FraudCheck }>("/fraud-check", { phone: ord.phone }).then((r) => setFraud(r.data)).catch(() => setFraud(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const subtotal = useMemo(() => items.reduce((a, b) => a + b.price * b.quantity, 0), [items]);
  if (error) return <Alert>{error}</Alert>;
  if (!o || (loading && !data)) return <div className="py-20 text-center"><Spinner /></div>;

  const set = <K extends keyof Order>(k: K, v: Order[K]) => setO((x) => (x ? { ...x, [k]: v } : x));
  const shipping = shipMode === "free" ? 0 : shipMode === "custom" ? o.delivery_charge : delivery[shipMode];
  const total = subtotal + shipping - (o.discount || 0) - (o.advance_paid || 0);
  const original = data!.data;

  const save = async () => {
    setBusy("save");
    try {
      await adminApi.put(`/orders/${o.id}`, {
        customer_name: o.customer_name, phone: normalizePhone(o.phone), address: o.address, district: o.district,
        delivery_area: o.delivery_area, note: o.note, admin_note: o.admin_note ?? null, source: o.source,
        delivery_charge: shipping, discount: o.discount || 0, advance_paid: o.advance_paid || 0,
        courier: o.courier, assigned_to: o.assigned_to ?? null,
        items: items.map((i) => ({ product_id: i.product_id, variant_id: i.variant_id, quantity: i.quantity, price: i.price })),
      });
      if (o.status !== original.status) await adminApi.post(`/orders/${o.id}/status`, { status: o.status, note: statusNote || undefined });
      setStatusNote("");
      toast("Order updated");
      reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(null);
    }
  };

  const sendCourier = async () => {
    setBusy("courier");
    try {
      await adminApi.post(`/orders/${o.id}/courier`, { courier, note: o.note ?? undefined });
      toast(`Sent to ${courier}`);
      reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(null);
    }
  };

  const refreshCourier = async () => {
    setBusy("refresh");
    try {
      await adminApi.post(`/orders/${o.id}/courier/refresh`);
      toast("Courier status refreshed");
      reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ButtonLink href="/admin/orders" variant="outline" size="icon" aria-label="Back to orders"><ArrowLeft className="h-4 w-4" /></ButtonLink>
          <div>
            <h2 className="font-display text-xl font-bold text-navy">{o.number}</h2>
            <p className="text-sm text-muted">{formatDate(o.created_at, true)} · <span className="capitalize">{o.source}</span> · COD</p>
          </div>
          <StatusBadge status={original.status} label={original.status_label} />
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/admin/orders/${o.id}/invoice`} target="_blank" variant="outline" icon={<Printer className="h-4 w-4" />}>Print invoice</ButtonLink>
          <Button variant="primary" onClick={save} loading={busy === "save"} icon={<Save className="h-4 w-4" />}>Update order</Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Customer info" action={fraud && <RiskBadge risk={fraud.risk} />} />
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <Input label="Name" value={o.customer_name} onChange={(e) => set("customer_name", e.target.value)} />
              <div className="flex flex-col gap-1.5">
                <Input label="Phone" value={o.phone} onChange={(e) => set("phone", e.target.value)} className="font-display" />
                <div className="flex flex-wrap gap-1.5">
                  <FraudCheckButton phone={o.phone} />
                  <ButtonLink href={`tel:${o.phone}`} size="sm" variant="soft" icon={<PhoneCall className="h-3.5 w-3.5" />}>Call</ButtonLink>
                  <ButtonLink href={`/admin/orders?search=${o.phone}`} size="sm" variant="ghost" icon={<History className="h-3.5 w-3.5" />}>History</ButtonLink>
                </div>
                {fraud && (
                  <p className="font-display text-xs text-muted">
                    Courier record: {fraud.delivered}/{fraud.total} delivered ({fraud.success_rate}%) · Our orders: {fraud.local.orders}
                    {fraud.blacklisted && <Badge tone="red" className="ml-1">Blacklisted</Badge>}
                  </p>
                )}
              </div>
              <Textarea label="Address" value={o.address} onChange={(e) => set("address", e.target.value)} wrapClassName="sm:col-span-2" rows={2} />
              <Select label="District" value={o.district ?? ""} onChange={(e) => set("district", e.target.value || null)}>
                <option value="">—</option>
                {BD_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
              </Select>
              <Select label="Delivery area" value={o.delivery_area} onChange={(e) => { const a = e.target.value as DeliveryArea; set("delivery_area", a); if (shipMode !== "free" && shipMode !== "custom") setShipMode(a); }}>
                <option value="inside_dhaka">ঢাকার ভিতরে</option>
                <option value="outside_dhaka">ঢাকার বাইরে</option>
              </Select>
            </div>
          </Card>

          <Card>
            <CardHeader title={`Order items (${items.length})`} />
            <div className="p-4">
              <ProductPicker onPick={({ product, variant }) => setItems((x) => {
                const ex = x.find((i) => i.product_id === product.id && i.variant_id === (variant?.id ?? null));
                if (ex) return x.map((i) => (i === ex ? { ...i, quantity: i.quantity + 1 } : i));
                return [...x, { product_id: product.id, variant_id: variant?.id ?? null, name: product.name, variant: variant?.name ?? null, image: product.image, price: variant?.price ?? product.final_price, quantity: 1 }];
              })} />
              <ul className="mt-3 divide-y divide-line">
                {items.length === 0 && <li className="py-6 text-center text-sm text-muted">No items — add a product above</li>}
                {items.map((it, idx) => (
                  <li key={`${it.product_id}-${it.variant_id}-${idx}`} className="flex flex-wrap items-center gap-3 py-3">
                    <span className="h-12 w-12 shrink-0"><ProductImage src={it.image} alt="" seed={it.product_id} rounded="rounded-lg" /></span>
                    <span className="min-w-[160px] flex-1">
                      <span className="block text-sm font-medium text-navy">{it.name}</span>
                      {it.variant && <span className="text-xs text-muted">{it.variant}</span>}
                    </span>
                    <label className="flex items-center gap-1 text-xs text-muted">৳
                      <input type="number" aria-label="Unit price" value={it.price} onChange={(e) => setItems((x) => x.map((y, j) => (j === idx ? { ...y, price: Number(e.target.value) || 0 } : y)))} className="font-display h-8 w-20 rounded-lg border border-line px-2 text-sm text-navy" />
                    </label>
                    <QtyStepper value={it.quantity} onChange={(n) => setItems((x) => x.map((y, j) => (j === idx ? { ...y, quantity: n } : y)))} />
                    <span className="font-display w-20 text-right font-semibold text-navy">{money(it.price * it.quantity)}</span>
                    <button type="button" onClick={() => setItems((x) => x.filter((_, j) => j !== idx))} className="rounded-lg p-1.5 text-muted hover:bg-rose-50 hover:text-rose-600" aria-label={`Remove ${it.name}`}><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card>
            <CardHeader title="Notes" />
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <Textarea label="Customer note" value={o.note ?? ""} onChange={(e) => set("note", e.target.value || null)} rows={3} />
              <Textarea label="Internal note (admin)" value={o.admin_note ?? ""} onChange={(e) => set("admin_note", e.target.value || null)} rows={3} />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Pricing" />
            <div className="space-y-3 p-4">
              <Select label="Shipping charge" value={shipMode} onChange={(e) => setShipMode(e.target.value as typeof shipMode)}>
                <option value="inside_dhaka">Inside Dhaka — {money(delivery.inside_dhaka)}</option>
                <option value="outside_dhaka">Outside Dhaka — {money(delivery.outside_dhaka)}</option>
                <option value="free">Free delivery</option>
                <option value="custom">Custom amount</option>
              </Select>
              {shipMode === "custom" && <Input label="Custom shipping (৳)" type="number" value={o.delivery_charge} onChange={(e) => set("delivery_charge", Number(e.target.value) || 0)} className="font-display" />}
              <div className="grid grid-cols-2 gap-3">
                <Input label="Advance paid (৳)" type="number" value={o.advance_paid} onChange={(e) => set("advance_paid", Number(e.target.value) || 0)} className="font-display" />
                <Input label="Discount (৳)" type="number" value={o.discount} onChange={(e) => set("discount", Number(e.target.value) || 0)} className="font-display" />
              </div>
              <dl className="space-y-1.5 rounded-xl bg-surface p-3 text-sm">
                <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-display font-medium text-navy">{money(subtotal)}</dd></div>
                <div className="flex justify-between"><dt>Shipping</dt><dd className="font-display text-navy">{money(shipping)}</dd></div>
                {o.discount > 0 && <div className="flex justify-between"><dt>Discount{o.coupon_code ? ` (${o.coupon_code})` : ""}</dt><dd className="font-display text-navy">−{money(o.discount)}</dd></div>}
                {o.advance_paid > 0 && <div className="flex justify-between"><dt>Advance</dt><dd className="font-display text-navy">−{money(o.advance_paid)}</dd></div>}
                <div className="flex justify-between border-t border-line pt-2 text-base font-bold text-navy"><dt>Collectable (COD)</dt><dd className="font-display">{money(total)}</dd></div>
              </dl>
            </div>
          </Card>

          <Card>
            <CardHeader title="Order details" />
            <div className="space-y-3 p-4">
              <Select label="Status" value={o.status} onChange={(e) => set("status", e.target.value as OrderStatus)}>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </Select>
              {o.status !== original.status && <Input label="Status note (optional)" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="e.g. customer confirmed by phone" />}
              <Select label="Source" value={o.source} onChange={(e) => set("source", e.target.value)}>
                {["web", "landing", "facebook", "manual", "pos", "app"].map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
              <Select label="Assign to" value={o.assigned_to ? String(o.assigned_to) : ""} onChange={(e) => set("assigned_to", e.target.value ? Number(e.target.value) : null)}>
                <option value="">Unassigned</option>
                {(staff.data?.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
              </Select>
              <div className="rounded-xl border border-line p-3">
                <p className="mb-2 text-sm font-semibold text-navy">Courier</p>
                <div className="mb-2"><CourierBadge order={original} /></div>
                {original.consignment_id && <p className="font-display mb-2 text-xs text-muted">Consignment: {original.consignment_id}</p>}
                <div className="flex gap-2">
                  <select aria-label="Courier" value={courier} onChange={(e) => { setCourier(e.target.value); set("courier", e.target.value as Order["courier"]); }} className="h-10 flex-1 rounded-xl border border-line bg-white px-2 text-sm">
                    {COURIERS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <Button variant="accent" onClick={sendCourier} loading={busy === "courier"} disabled={!!original.consignment_id} icon={<Send className="h-4 w-4" />}>Send</Button>
                </div>
                {original.consignment_id && (
                  <Button className="mt-2 w-full" variant="outline" size="sm" onClick={refreshCourier} loading={busy === "refresh"} icon={<RefreshCw className="h-3.5 w-3.5" />}>Refresh courier status</Button>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Status history" />
            <ol className="space-y-0 p-4">
              {[...original.history].reverse().map((h, i) => (
                <li key={i} className="relative border-l-2 border-line pb-4 pl-4 last:pb-0">
                  <span className="absolute top-1 -left-[7px] h-3 w-3 rounded-full border-2 border-white bg-teal" aria-hidden="true" />
                  <div className="flex items-center gap-2"><StatusBadge status={h.status} /><span className="text-xs text-muted">{formatDate(h.created_at, true)}</span></div>
                  {h.note && <p className="mt-1 text-sm">{h.note}</p>}
                  {h.user && <p className="text-xs text-muted">by {h.user}</p>}
                </li>
              ))}
            </ol>
          </Card>
          <Link href={`/admin/orders?search=${o.phone}`} className="block text-center text-sm text-teal-dark hover:underline">Other orders from this phone →</Link>
        </div>
      </div>
    </div>
  );
}
