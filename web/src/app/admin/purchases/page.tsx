"use client";

import { useState } from "react";
import { PackagePlus, Trash2 } from "lucide-react";
import { adminApi, errorMessage } from "@/lib/api";
import { useAdminQuery } from "@/lib/use-admin-query";
import { cn, formatDate, money } from "@/lib/format";
import type { Paginated, Purchase, Supplier } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyRow, Table, Td, Th } from "@/components/ui/Table";
import { Alert, Spinner } from "@/components/ui/misc";
import { CrudPage } from "@/components/admin/CrudPage";
import { PageHeader } from "@/components/admin/common";
import { ProductPicker } from "@/components/admin/ProductPicker";
import { useToast } from "@/components/admin/Toast";

type Line = { product_id: number; variant_id: number | null; name: string; quantity: number; unit_cost: number };

function Purchases() {
  const toast = useToast();
  const { data, loading, error, reload } = useAdminQuery<Paginated<Purchase>>("/purchases");
  const suppliers = useAdminQuery<Paginated<Supplier>>("/suppliers", { per_page: 200 });
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<Line[]>([]);
  const [paid, setPaid] = useState(0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const total = lines.reduce((a, b) => a + b.quantity * b.unit_cost, 0);

  const save = async () => {
    if (!supplierId || !lines.length) return toast("Choose a supplier and add items", "error");
    setBusy(true);
    try {
      await adminApi.post("/purchases", { supplier_id: Number(supplierId), date, items: lines.map(({ product_id, variant_id, quantity, unit_cost }) => ({ product_id, variant_id, quantity, unit_cost })), paid, note: note || null });
      toast("Purchase saved — stock increased");
      setOpen(false);
      setLines([]); setPaid(0); setNote("");
      reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader title="Purchases (stock in)" action={<Button variant="accent" size="sm" onClick={() => setOpen(true)} icon={<PackagePlus className="h-4 w-4" />}>New purchase</Button>} />
        {error && <div className="p-3"><Alert>{error}</Alert></div>}
        <Table>
          <thead><tr><Th>#</Th><Th>Date</Th><Th>Supplier</Th><Th>Items</Th><Th>Total</Th><Th>Paid</Th><Th>Due</Th></tr></thead>
          <tbody>
            {loading && !data ? <EmptyRow colSpan={7}><Spinner /></EmptyRow> : !data?.data.length ? <EmptyRow colSpan={7}>No purchases yet</EmptyRow> : data.data.map((p) => {
              const t = p.total ?? p.items.reduce((a, b) => a + b.quantity * b.unit_cost, 0);
              return (
                <tr key={p.id}>
                  <Td className="font-display">{p.id}</Td>
                  <Td>{formatDate(p.date)}</Td>
                  <Td className="font-medium text-navy">{p.supplier?.name ?? suppliers.data?.data.find((s) => s.id === p.supplier_id)?.name ?? "—"}</Td>
                  <Td className="text-xs">{p.items.map((i) => `${i.name ?? `#${i.product_id}`} ×${i.quantity}`).join(", ")}</Td>
                  <Td className="font-display font-semibold">{money(t)}</Td>
                  <Td className="font-display">{money(p.paid)}</Td>
                  <Td className={cn("font-display", t - p.paid > 0 && "text-rose-600")}>{money(t - p.paid)}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="New purchase" size="xl" footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button variant="accent" loading={busy} onClick={save}>Save purchase</Button></>}>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Select label="Supplier" required value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">Select supplier</option>
              {(suppliers.data?.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input label="Paid (৳)" type="number" value={paid} onChange={(e) => setPaid(Number(e.target.value) || 0)} className="font-display" />
          </div>
          <ProductPicker onPick={({ product, variant }) => setLines((x) => [...x, { product_id: product.id, variant_id: variant?.id ?? null, name: product.name + (variant ? ` (${variant.name})` : ""), quantity: 1, unit_cost: product.cost_price ?? 0 }])} />
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-surface text-left text-xs text-muted uppercase"><tr><th className="px-3 py-2">Product</th><th className="px-3 py-2">Qty</th><th className="px-3 py-2">Unit cost</th><th className="px-3 py-2 text-right">Total</th><th /></tr></thead>
              <tbody>
                {lines.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-muted">Add products above</td></tr>}
                {lines.map((l, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="px-3 py-1.5 text-navy">{l.name}</td>
                    <td className="px-3 py-1.5"><input aria-label="Quantity" type="number" min={1} value={l.quantity} onChange={(e) => setLines((x) => x.map((y, j) => (j === i ? { ...y, quantity: Number(e.target.value) || 1 } : y)))} className="font-display h-8 w-20 rounded-lg border border-line px-2" /></td>
                    <td className="px-3 py-1.5"><input aria-label="Unit cost" type="number" value={l.unit_cost} onChange={(e) => setLines((x) => x.map((y, j) => (j === i ? { ...y, unit_cost: Number(e.target.value) || 0 } : y)))} className="font-display h-8 w-24 rounded-lg border border-line px-2" /></td>
                    <td className="font-display px-3 py-1.5 text-right">{money(l.quantity * l.unit_cost)}</td>
                    <td className="px-2"><button type="button" aria-label="Remove" onClick={() => setLines((x) => x.filter((_, j) => j !== i))} className="p-1 text-muted hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="font-display text-right font-bold text-navy">Total {money(total)} · Due {money(total - paid)}</p>
          <Textarea label="Note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        </div>
      </Modal>
    </>
  );
}

export default function PurchasesPage() {
  const [tab, setTab] = useState<"purchases" | "suppliers">("purchases");
  return (
    <>
      <PageHeader title="Suppliers & Purchases" subtitle="Record stock purchases from suppliers" actions={
        <div className="inline-flex rounded-xl border border-line bg-white p-1" role="tablist">
          {(["purchases", "suppliers"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold capitalize", tab === t ? "bg-navy text-white" : "text-navy")}>{t}</button>
          ))}
        </div>
      } />
      {tab === "purchases" ? <Purchases /> : (
        <CrudPage<Supplier>
          title="Suppliers"
          endpoint="/suppliers"
          columns={[
            { key: "name", label: "Name", render: (s) => <span className="font-medium text-navy">{s.name}</span> },
            { key: "phone", label: "Phone", render: (s) => <span className="font-display">{s.phone ?? "—"}</span> },
            { key: "address", label: "Address" },
            { key: "balance", label: "Due balance", render: (s) => <span className="font-display">{money(s.balance ?? 0)}</span> },
          ]}
          fields={[{ name: "name", label: "Name", required: true }, { name: "phone", label: "Phone" }, { name: "address", label: "Address", type: "textarea" }]}
        />
      )}
    </>
  );
}
