"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { Eye, Printer, Search, Send } from "lucide-react";
import { adminApi, errorMessage } from "@/lib/api";
import { useAdminQuery } from "@/lib/use-admin-query";
import { COURIERS, cn, formatDate, money, ORDER_STATUSES, STATUS_LABELS } from "@/lib/format";
import type { Order, OrderStatus, Paginated } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyRow, Table, Td, Th } from "@/components/ui/Table";
import { Alert, Spinner } from "@/components/ui/misc";
import { AdminPager, FraudCheckButton, PageHeader } from "@/components/admin/common";
import { useToast } from "@/components/admin/Toast";
import { CourierBadge, StatusSelect } from "@/components/admin/order-bits";

function OrdersInner() {
  const params = useSearchParams();
  const toast = useToast();
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [q, setQ] = useState(params.get("search") ?? "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [courier, setCourier] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkCourier, setBulkCourier] = useState("steadfast");
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload, setData } = useAdminQuery<Paginated<Order>>("/orders", { status, page, search: q, from, to, courier, per_page: 20 });

  useEffect(() => setSelected([]), [status, page, q, from, to, courier]);

  const counts = data?.meta.counts ?? {};
  const rows = data?.data ?? [];
  const allChecked = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  const quickStatus = async (o: Order, s: OrderStatus) => {
    const prev = data;
    setData((d) => (d ? { ...d, data: d.data.map((x) => (x.id === o.id ? { ...x, status: s, status_label: STATUS_LABELS[s] } : x)) } : d));
    try {
      await adminApi.post(`/orders/${o.id}/status`, { status: s });
      toast(`${o.number} → ${STATUS_LABELS[s]}`);
      reload();
    } catch (e) {
      setData(prev);
      toast(errorMessage(e), "error");
    }
  };

  const bulk = async (kind: "status" | "courier") => {
    if (!selected.length) return;
    setBusy(true);
    try {
      if (kind === "status") {
        if (!bulkStatus) return;
        await adminApi.post("/orders/bulk-status", { ids: selected, status: bulkStatus });
        toast(`${selected.length} orders updated`);
      } else {
        await adminApi.post("/orders/bulk-courier", { ids: selected, courier: bulkCourier });
        toast(`${selected.length} orders sent to ${bulkCourier}`);
      }
      setSelected([]);
      reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const submitSearch = (e: FormEvent) => { e.preventDefault(); setPage(1); setQ(search.trim()); };
  const tabs = [{ value: "", label: "All", count: counts.all ?? data?.meta.total }, ...ORDER_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s], count: counts[s] }))];

  return (
    <>
      <PageHeader title="Orders" subtitle="Confirm, ship and track every order" actions={<ButtonLink href="/admin/pos" variant="accent">+ New order (POS)</ButtonLink>} />
      <Card>
        <div className="scrollbar-none flex gap-1 overflow-x-auto border-b border-line px-2 pt-2" role="tablist" aria-label="Order status">
          {tabs.map((t) => (
            <button
              key={t.value || "all"}
              role="tab"
              type="button"
              aria-selected={status === t.value}
              onClick={() => { setStatus(t.value); setPage(1); }}
              className={cn("relative flex items-center gap-1.5 rounded-t-lg px-3 py-2.5 text-sm font-semibold whitespace-nowrap", status === t.value ? "text-teal-dark" : "text-muted hover:text-navy")}
            >
              {t.label}
              {t.count !== undefined && <span className={cn("font-display rounded-full px-1.5 text-[0.7rem]", status === t.value ? "bg-teal text-white" : "bg-surface text-navy")}>{t.count}</span>}
              {status === t.value && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-teal" aria-hidden="true" />}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-2 border-b border-line p-3">
          <form onSubmit={submitSearch} className="flex min-w-[240px] flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <label htmlFor="order-search" className="sr-only">Search orders</label>
              <input id="order-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order no, phone or name" className="h-10 w-full rounded-xl border border-line pr-3 pl-9 text-sm focus:border-teal focus:outline-none" />
            </div>
            <Button type="submit" variant="outline">Search</Button>
          </form>
          <label className="flex flex-col text-xs text-muted">From<input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="mt-0.5 h-10 rounded-xl border border-line px-2 text-sm text-navy" /></label>
          <label className="flex flex-col text-xs text-muted">To<input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="mt-0.5 h-10 rounded-xl border border-line px-2 text-sm text-navy" /></label>
          <label className="flex flex-col text-xs text-muted">Courier
            <select value={courier} onChange={(e) => { setCourier(e.target.value); setPage(1); }} className="mt-0.5 h-10 rounded-xl border border-line bg-white px-2 text-sm text-navy">
              <option value="">All couriers</option>
              {COURIERS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-teal-50/60 px-3 py-2.5 text-sm">
            <span className="font-semibold text-navy">{selected.length} selected</span>
            <select aria-label="Bulk status" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="h-8 rounded-lg border border-line bg-white px-2 text-sm">
              <option value="">Change status…</option>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            <Button size="sm" variant="primary" disabled={!bulkStatus} loading={busy} onClick={() => bulk("status")}>Apply</Button>
            <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
            <select aria-label="Bulk courier" value={bulkCourier} onChange={(e) => setBulkCourier(e.target.value)} className="h-8 rounded-lg border border-line bg-white px-2 text-sm">
              {COURIERS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <Button size="sm" variant="accent" loading={busy} onClick={() => bulk("courier")} icon={<Send className="h-3.5 w-3.5" />}>Send to courier</Button>
          </div>
        )}

        {error && <div className="p-3"><Alert>{error}</Alert></div>}
        <Table className="min-w-[1000px]">
          <thead>
            <tr>
              <Th className="w-10"><input type="checkbox" aria-label="Select all" checked={allChecked} onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])} className="h-4 w-4 accent-teal" /></Th>
              <Th>Order</Th><Th>Customer</Th><Th>Items</Th><Th>Total</Th><Th>Status</Th><Th>Courier</Th><Th>Source</Th><Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading && !data ? <EmptyRow colSpan={9}><Spinner /></EmptyRow> : rows.length === 0 ? <EmptyRow colSpan={9}>No orders found</EmptyRow> : rows.map((o) => (
              <tr key={o.id} className={cn("hover:bg-surface/60", selected.includes(o.id) && "bg-teal-50/40")}>
                <Td><input type="checkbox" aria-label={`Select ${o.number}`} checked={selected.includes(o.id)} onChange={(e) => setSelected((s) => (e.target.checked ? [...s, o.id] : s.filter((x) => x !== o.id)))} className="h-4 w-4 accent-teal" /></Td>
                <Td>
                  <Link href={`/admin/orders/${o.id}`} className="font-display font-semibold whitespace-nowrap text-teal-dark hover:underline">{o.number}</Link>
                  <span className="block text-xs whitespace-nowrap text-muted">{formatDate(o.created_at, true)}</span>
                </Td>
                <Td>
                  <span className="font-medium text-navy">{o.customer_name}</span>
                  <span className="font-display block text-xs">{o.phone}</span>
                  <span className="block max-w-[200px] truncate text-xs text-muted" title={o.address}>{o.address}</span>
                </Td>
                <Td className="max-w-[200px] text-xs">{o.items.map((i) => `${i.name}${i.variant ? ` (${i.variant})` : ""} ×${i.quantity}`).join(", ")}</Td>
                <Td className="font-display font-semibold whitespace-nowrap">{money(o.total)}</Td>
                <Td><StatusSelect value={o.status} onChange={(s) => quickStatus(o, s)} /></Td>
                <Td><CourierBadge order={o} /></Td>
                <Td><Badge className="capitalize">{o.source}</Badge></Td>
                <Td className="text-right">
                  <div className="inline-flex gap-1.5">
                    <FraudCheckButton phone={o.phone} label="Fraud" />
                    <ButtonLink href={`/admin/orders/${o.id}/invoice`} target="_blank" size="sm" variant="ghost" aria-label="Print invoice"><Printer className="h-4 w-4" /></ButtonLink>
                    <ButtonLink href={`/admin/orders/${o.id}`} size="sm" variant="outline" icon={<Eye className="h-3.5 w-3.5" />}>View</ButtonLink>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {data?.meta && <AdminPager page={data.meta.current_page} last={data.meta.last_page} total={data.meta.total} onPage={setPage} />}
      </Card>
    </>
  );
}

export default function OrdersPage() {
  return <Suspense fallback={<Spinner />}><OrdersInner /></Suspense>;
}
