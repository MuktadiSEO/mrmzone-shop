"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { BadgeCheck, Banknote, Lock, TicketPercent, X } from "lucide-react";
import { ApiError, errorMessage, shopApi } from "@/lib/api";
import { deliveryCharge } from "@/lib/cart";
import { useSettings } from "@/lib/settings-context";
import { useCustomer } from "@/lib/customer-auth";
import { BD_DISTRICTS, cn, isValidBdPhone, money, normalizePhone, toBanglaDigits } from "@/lib/format";
import { readSession, writeSession } from "@/lib/storage";
import { track } from "@/lib/pixel";
import type { CouponResult, DeliveryArea, Order } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/misc";
import { ProductImage } from "./ProductImage";

export interface CheckoutLine {
  product_id: number;
  variant_id: number | null;
  name: string;
  variant: string | null;
  image: string | null;
  price: number;
  quantity: number;
}

export const LAST_ORDER_KEY = "mrm_last_order";
export const UTM_KEY = "mrm_utm";

interface Props {
  lines: CheckoutLine[];
  onSuccess?: (order: Order) => void;
  /** extra content rendered above the order summary (e.g. landing page variant picker) */
  summaryTop?: ReactNode;
  submitLabel?: string;
  accent?: string;
  layout?: "two-column" | "stacked";
  /** validate external state (e.g. variant selection) before submitting; return error message or null */
  beforeSubmit?: () => string | null;
}

export function CheckoutForm({ lines, onSuccess, summaryTop, submitLabel = "অর্ডার কনফার্ম করুন", accent, layout = "two-column", beforeSubmit }: Props) {
  const router = useRouter();
  const settings = useSettings();
  const { user } = useCustomer();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState<DeliveryArea>("inside_dhaka");
  const [note, setNote] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [couponErr, setCouponErr] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formErr, setFormErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const draftId = useRef<number | null>(null);
  const lastDraftKey = useRef<string>("");
  const initiated = useRef(false);

  useEffect(() => {
    if (user) {
      /* prefill once from the logged-in profile */
      setName((n) => n || user.name || "");
      setPhone((p) => p || user.phone || "");
      const a = user.addresses?.[0];
      if (a) setAddress((x) => x || a.address);
    }
  }, [user]);

  const qty = lines.reduce((a, b) => a + b.quantity, 0);
  const subtotal = lines.reduce((a, b) => a + b.price * b.quantity, 0);
  const delivery = lines.length ? deliveryCharge(area, qty, settings.delivery) : 0;
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const total = subtotal + delivery - discount;
  const freeMin = settings.delivery.free_delivery_min_qty;

  useEffect(() => {
    if (initiated.current || !lines.length) return;
    initiated.current = true;
    const t = setTimeout(() => track("InitiateCheckout", { value: subtotal, num_items: qty, content_ids: lines.map((l) => String(l.product_id)), content_type: "product" }), 400);
    return () => clearTimeout(t);
  }, [lines, subtotal, qty]);

  // coupon discount depends on subtotal — drop it if cart changes underneath
  const subtotalRef = useRef(subtotal);
  useEffect(() => {
    if (coupon && subtotalRef.current !== subtotal) {
      setCoupon(null);
      setCouponErr("কার্ট পরিবর্তন হয়েছে — কুপন আবার প্রয়োগ করুন");
    }
    subtotalRef.current = subtotal;
  }, [subtotal, coupon]);

  const items = useMemo(() => lines.map((l) => ({ product_id: l.product_id, variant_id: l.variant_id, quantity: l.quantity })), [lines]);

  const saveDraft = () => {
    if (!isValidBdPhone(phone) || !items.length) return;
    const p = normalizePhone(phone);
    const key = `${p}|${name}|${address}|${JSON.stringify(items)}`;
    if (key === lastDraftKey.current) return;
    lastDraftKey.current = key;
    shopApi
      .draft({ phone: p, name: name || undefined, address: address || undefined, items })
      .then((r) => { if (r?.data?.id) draftId.current = r.data.id; })
      .catch(() => { /* abandoned-cart capture is best effort */ });
  };

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;
    setCouponBusy(true);
    setCouponErr(null);
    try {
      const r = await shopApi.validateCoupon(code, subtotal);
      setCoupon(r.data);
    } catch (e) {
      setCoupon(null);
      setCouponErr(e instanceof ApiError ? e.field("code") ?? e.message : errorMessage(e));
    } finally {
      setCouponBusy(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.customer_name = "আপনার নাম লিখুন";
    if (!isValidBdPhone(phone)) e.phone = "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন 01XXXXXXXXX)";
    if (address.trim().length < 8) e.address = "বিস্তারিত ঠিকানা লিখুন (বাসা/রোড, এলাকা, থানা)";
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setFormErr(null);
    const external = beforeSubmit?.();
    if (external) { setFormErr(external); return; }
    if (!lines.length) { setFormErr("কার্টে কোনো পণ্য নেই"); return; }
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(`co-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      const utm = readSession<{ utm_source?: string; utm_campaign?: string }>(UTM_KEY, {});
      const r = await shopApi.placeOrder({
        customer_name: name.trim(),
        phone: normalizePhone(phone),
        address: address.trim(),
        district: district || undefined,
        delivery_area: area,
        note: note.trim() || undefined,
        coupon_code: coupon?.code,
        payment_method: "cod",
        items,
        draft_id: draftId.current ?? undefined,
        utm_source: utm.utm_source,
        utm_campaign: utm.utm_campaign,
      });
      const order = r.data;
      writeSession(LAST_ORDER_KEY, order);
      onSuccess?.(order);
      router.push(`/order/success/${encodeURIComponent(order.number)}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const fe: Record<string, string> = {};
        Object.entries(err.errors || {}).forEach(([k, v]) => (fe[k] = v[0]));
        setErrors(fe);
        if (fe.code || fe.coupon_code) setCoupon(null);
      }
      setFormErr(errorMessage(err));
      setBusy(false);
    }
  };

  const accentStyle = accent ? { backgroundColor: accent } : undefined;

  const summary = (
    <div className="space-y-3">
      {layout === "two-column" && summaryTop}
      <div className="rounded-2xl border border-line bg-white p-4">
        <h2 className="mb-2 font-semibold">অর্ডার সারাংশ</h2>
        <ul className="divide-y divide-line">
          {lines.map((l) => (
            <li key={`${l.product_id}:${l.variant_id}`} className="flex items-center gap-3 py-2.5">
              <span className="relative h-12 w-12 shrink-0">
                <ProductImage src={l.image} alt={l.name} seed={l.product_id} rounded="rounded-lg" />
                <span className="font-display absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-navy px-1 text-[0.68rem] font-bold text-white">{l.quantity}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-1 text-sm font-medium text-navy">{l.name}</span>
                {l.variant && <span className="block text-xs text-muted">{l.variant}</span>}
              </span>
              <span className="font-display text-sm font-semibold text-navy">{money(l.price * l.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 border-t border-line pt-3">
          {coupon ? (
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <span className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4" aria-hidden="true" /> কুপন <b className="font-display">{coupon.code}</b> প্রয়োগ হয়েছে</span>
              <button type="button" onClick={() => { setCoupon(null); setCouponCode(""); }} aria-label="কুপন সরান" className="rounded p-1 hover:bg-emerald-100"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="flex gap-2">
              <label htmlFor="co-coupon" className="sr-only">কুপন কোড</label>
              <div className="relative flex-1">
                <TicketPercent className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input id="co-coupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="কুপন কোড" className="font-display h-10 w-full rounded-xl border border-line pr-3 pl-9 text-sm uppercase focus:border-teal focus:outline-none" />
              </div>
              <Button size="md" variant="outline" onClick={applyCoupon} loading={couponBusy} className="h-10">প্রয়োগ</Button>
            </div>
          )}
          {couponErr && <p className="mt-1.5 text-xs text-red-600" role="alert">{couponErr}</p>}
        </div>

        <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt>সাবটোটাল ({toBanglaDigits(qty)}টি পণ্য)</dt><dd className="font-display font-medium text-navy">{money(subtotal)}</dd></div>
          <div className="flex justify-between">
            <dt>ডেলিভারি চার্জ</dt>
            <dd className="font-display font-medium text-navy">{delivery === 0 && lines.length ? <span className="text-emerald-700">ফ্রি</span> : money(delivery)}</dd>
          </div>
          {discount > 0 && <div className="flex justify-between text-emerald-700"><dt>কুপন ছাড়</dt><dd className="font-display font-medium">−{money(discount)}</dd></div>}
          <div className="flex justify-between border-t border-dashed border-line pt-2 text-base font-bold text-navy"><dt>সর্বমোট</dt><dd className="font-display text-xl">{money(total)}</dd></div>
        </dl>
        {freeMin > 0 && qty < freeMin && lines.length > 0 && (
          <p className="mt-2 rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-dark">আর {toBanglaDigits(freeMin - qty)}টি পণ্য যোগ করলে ডেলিভারি চার্জ ফ্রি!</p>
        )}
      </div>
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className={cn("grid gap-4", layout === "two-column" && "lg:grid-cols-[1fr_400px] lg:items-start lg:gap-6")}>
      <div className="space-y-4">
        {layout === "stacked" && summaryTop}
        <div className="rounded-2xl border border-line bg-white p-4 sm:p-5">
          <h2 className="mb-1 font-semibold">ডেলিভারি তথ্য</h2>
          <p className="mb-4 text-sm text-muted">অর্ডার কনফার্ম করতে নিচের তথ্যগুলো দিন। আমাদের প্রতিনিধি ফোন করে নিশ্চিত করবেন।</p>
          <div className="grid gap-3.5">
            <Input id="co-customer_name" label="আপনার নাম" required autoComplete="name" placeholder="পুরো নাম লিখুন" value={name} onChange={(e) => setName(e.target.value)} error={errors.customer_name} />
            <Input
              id="co-phone"
              label="মোবাইল নম্বর"
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="01XXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => { if (phone && !isValidBdPhone(phone)) setErrors((x) => ({ ...x, phone: "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন" })); else { setErrors((x) => { const n = { ...x }; delete n.phone; return n; }); saveDraft(); } }}
              error={errors.phone}
              hint="বাংলা বা ইংরেজি সংখ্যায় লিখতে পারেন"
              className="font-display tracking-wide"
            />
            <Textarea id="co-address" label="সম্পূর্ণ ঠিকানা" required autoComplete="street-address" placeholder="বাসা/রোড নং, এলাকা, থানা, জেলা" value={address} onChange={(e) => setAddress(e.target.value)} onBlur={saveDraft} error={errors.address} rows={2} />
            <Select id="co-district" label="জেলা" value={district} onChange={(e) => { setDistrict(e.target.value); if (e.target.value) setArea(e.target.value === "Dhaka" ? "inside_dhaka" : "outside_dhaka"); }} error={errors.district}>
              <option value="">জেলা নির্বাচন করুন</option>
              {BD_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-navy">ডেলিভারি এলাকা <span className="text-sale">*</span></legend>
              <div className="grid grid-cols-2 gap-2">
                {([["inside_dhaka", "ঢাকার ভিতরে", settings.delivery.inside_dhaka], ["outside_dhaka", "ঢাকার বাইরে", settings.delivery.outside_dhaka]] as const).map(([v, label, charge]) => (
                  <label key={v} className={cn("flex cursor-pointer items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 transition", area === v ? "border-teal bg-teal-50" : "border-line bg-white hover:border-teal/50")}>
                    <input type="radio" name="delivery_area" value={v} checked={area === v} onChange={() => setArea(v)} className="h-4 w-4 accent-teal" />
                    <span className="leading-tight">
                      <span className="block text-sm font-semibold text-navy">{label}</span>
                      <span className="font-display block text-xs text-muted">{freeMin > 0 && qty >= freeMin ? "ফ্রি" : money(charge)}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Textarea id="co-note" label="অতিরিক্ত নোট (ঐচ্ছিক)" placeholder="যেমন: বিকালে ডেলিভারি দিবেন" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 sm:p-5">
          <h2 className="mb-3 font-semibold">পেমেন্ট পদ্ধতি</h2>
          <label className="flex items-center gap-3 rounded-xl border-2 border-teal bg-teal-50 px-3 py-3">
            <input type="radio" checked readOnly name="payment" className="h-4 w-4 accent-teal" />
            <Banknote className="h-6 w-6 text-teal-dark" aria-hidden="true" />
            <span className="leading-tight">
              <span className="block font-semibold text-navy">ক্যাশ অন ডেলিভারি</span>
              <span className="block text-xs text-muted">পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন</span>
            </span>
          </label>
        </div>
        {layout === "stacked" && summary}
      </div>

      <div className={cn("space-y-3", layout === "two-column" && "lg:sticky lg:top-36")}>
        {layout === "two-column" && summary}
        {formErr && <Alert>{formErr}</Alert>}
        <Button type="submit" size="lg" variant="accent" loading={busy} className="h-14 w-full text-lg" style={accentStyle} icon={<Lock className="h-5 w-5" />}>
          {submitLabel} — <span className="font-display">{money(total)}</span>
        </Button>
        <p className="text-center text-xs text-muted">অর্ডার করার মাধ্যমে আপনি আমাদের <Link className="underline" href="/page/terms">শর্তাবলী</Link> মেনে নিচ্ছেন।</p>
      </div>
    </form>
  );
}
