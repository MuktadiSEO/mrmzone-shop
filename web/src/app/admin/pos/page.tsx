"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, ShoppingCart, Trash2 } from "lucide-react";
import { adminApi, errorMessage } from "@/lib/api";
import { BD_PHONE_RE, cn, money, normalizePhone } from "@/lib/format";
import type { AdminProduct, DeliveryArea, Order, Paginated, ProductVariant } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/misc";
import { ProductImage } from "@/components/shop/ProductImage";
import { QtyStepper } from "@/components/shop/MiniCart";
import { PageHeader } from "@/components/admin/common";
import { useToast } from "@/components/admin/Toast";

interface Line { product_id: number; variant_id: number | null; name: string; variant: string | null; price: number; quantity: number; image: string | null }

export default function PosPage() {
  const router = useRouter();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [pick, setPick] = useState<AdminProduct | null>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState<DeliveryArea>("inside_dhaka");
  const [source, setSource] = useState("pos");
  const [shipping, setShipping] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      adminApi.get<Paginated<AdminProduct>>("/products", { search: q, status: "active", per_page: 24 }).then((r) => setProducts(r.data)).catch(() => setProducts([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const addLine = (p: AdminProduct, v: ProductVariant | null) => {
    setLines((x) => {
      const ex = x.find((l) => l.product_id === p.id && l.variant_id === (v?.id ?? null));
      if (ex) return x.map((l) => (l === ex ? { ...l, quantity: l.quantity + 1 } : l));
      return [...x, { product_id: p.id, variant_id: v?.id ?? null, name: p.name, variant: v?.name ?? null, price: v?.price ?? p.final_price, quantity: 1, image: p.image }];
    });
    setPick(null);
  };

  const subtotal = lines.reduce((a, b) => a + b.price * b.quantity, 0);
  const total = subtotal + shipping - discount;

  const submit = async () => {
    const ph = normalizePhone(phone);
    if (!lines.length) return toast("Add at least one product", "error");
    if (!BD_PHONE_RE.test(ph)) return toast("Enter a valid phone number", "error");
    setBusy(true);
    try {
      const r = await adminApi.post<{ data: Order }>("/orders", {
        source, customer_name: name || "Walk-in customer", phone: ph, address: address || "Store pickup", delivery_area: area,
        delivery_charge: shipping, discount, advance_paid: paid, note: note || undefined, payment_method: "cod",
        items: lines.map((l) => ({ product_id: l.product_id, variant_id: l.variant_id, quantity: l.quantity, price: l.price })),
      });
      toast(`Order ${r.data.number} created`);
      router.push(`/admin/orders/${r.data.id}`);
    } catch (e) {
      toast(errorMessage(e), "error");
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="POS / Manual order" subtitle="Create orders from phone calls, Facebook inbox or the counter" />
      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card>
          <div className="border-b border-line p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" aria-label="Search products" className="h-11 w-full rounded-xl border border-line pr-3 pl-9 text-sm focus:border-teal focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 lg:grid-cols-4">
            {products === null ? <Spinner /> : products.length === 0 ? <p className="col-span-full py-8 text-center text-sm text-muted">No products</p> : products.map((p) => (
              <button key={p.id} type="button" disabled={p.stock <= 0} onClick={() => (p.variants?.length ? setPick(p) : addLine(p, null))} className="flex flex-col overflow-hidden rounded-xl border border-line bg-white text-left transition hover:border-teal hover:shadow-card disabled:opacity-50">
                <span className="aspect-square"><ProductImage src={p.image} alt="" seed={p.id} categorySlug={p.category?.slug} rounded="" /></span>
                <span className="p-2">
                  <span className="line-clamp-2 text-xs font-medium text-navy">{p.name}</span>
                  <span className="font-display mt-1 flex justify-between text-xs"><b className="text-teal-dark">{money(p.final_price)}</b><span className={cn(p.stock <= 5 ? "text-rose-600" : "text-muted")}>{p.stock} pcs</span></span>
                </span>
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title={<span className="inline-flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Cart ({lines.length})</span>} />
            <ul className="divide-y divide-line px-4">
              {lines.length === 0 && <li className="py-6 text-center text-sm text-muted">Tap a product to add it</li>}
              {lines.map((l, i) => (
                <li key={`${l.product_id}-${l.variant_id}`} className="flex items-center gap-2 py-2.5">
                  <span className="min-w-0 flex-1 text-sm"><span className="block truncate font-medium text-navy">{l.name}</span>{l.variant && <span className="text-xs text-muted">{l.variant}</span>}</span>
                  <QtyStepper value={l.quantity} onChange={(n) => setLines((x) => x.map((y, j) => (j === i ? { ...y, quantity: n } : y)))} />
                  <span className="font-display w-16 text-right text-sm font-semibold">{money(l.price * l.quantity)}</span>
                  <button type="button" onClick={() => setLines((x) => x.filter((_, j) => j !== i))} aria-label={`Remove ${l.name}`} className="p-1 text-muted hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Customer & payment" />
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <Input label="Phone" required value={phone} onChange={(e) => setPhone(e.target.value)} className="font-display" inputMode="tel" />
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Textarea label="Address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} wrapClassName="sm:col-span-2" />
              <Select label="Area" value={area} onChange={(e) => setArea(e.target.value as DeliveryArea)}>
                <option value="inside_dhaka">Inside Dhaka</option><option value="outside_dhaka">Outside Dhaka</option>
              </Select>
              <Select label="Source" value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="pos">POS (counter)</option><option value="manual">Phone call</option><option value="facebook">Facebook inbox</option>
              </Select>
              <Input label="Shipping (৳)" type="number" value={shipping} onChange={(e) => setShipping(Number(e.target.value) || 0)} className="font-display" />
              <Input label="Discount (৳)" type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} className="font-display" />
              <Input label="Paid now (৳)" type="number" value={paid} onChange={(e) => setPaid(Number(e.target.value) || 0)} className="font-display" />
              <Input label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="border-t border-line p-4">
              <dl className="mb-3 space-y-1 text-sm">
                <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-display">{money(subtotal)}</dd></div>
                <div className="flex justify-between text-base font-bold text-navy"><dt>Total</dt><dd className="font-display">{money(total)}</dd></div>
                {paid > 0 && <div className="flex justify-between text-muted"><dt>Due</dt><dd className="font-display">{money(total - paid)}</dd></div>}
              </dl>
              <Button variant="accent" size="lg" className="w-full" loading={busy} onClick={submit}>Create order</Button>
            </div>
          </Card>
        </div>
      </div>
      <Modal open={!!pick} onClose={() => setPick(null)} title={pick?.name ?? ""}>
        <ul className="grid gap-2 sm:grid-cols-2">
          {pick?.variants.map((v) => (
            <li key={v.id}>
              <button type="button" disabled={v.stock <= 0} onClick={() => addLine(pick, v)} className="flex w-full items-center justify-between rounded-xl border border-line px-3 py-2.5 text-sm hover:border-teal disabled:opacity-40">
                <span className="font-medium text-navy">{v.name}</span>
                <span className="font-display text-xs text-muted">{money(v.price)} · {v.stock}</span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
