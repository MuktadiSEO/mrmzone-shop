"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdminQuery } from "@/lib/use-admin-query";
import { cn, formatDate, money } from "@/lib/format";
import type { AdminProduct, Paginated, StockMovement } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyRow, Table, Td, Th } from "@/components/ui/Table";
import { Spinner } from "@/components/ui/misc";
import { AdminPager, PageHeader } from "@/components/admin/common";

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [low, setLow] = useState(false);
  const [productId, setProductId] = useState<number | null>(null);
  const products = useAdminQuery<Paginated<AdminProduct>>("/products", { page, stock: low ? "low" : "", per_page: 20 });
  const moves = useAdminQuery<Paginated<StockMovement>>("/stock-movements", { product_id: productId ?? "" });
  const stockValue = (products.data?.data ?? []).reduce((a, p) => a + (p.cost_price ?? 0) * p.stock, 0);

  return (
    <>
      <PageHeader title="Inventory" subtitle={`Stock value on this page (at cost): ${money(stockValue)}`} actions={
        <label className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm text-navy"><input type="checkbox" checked={low} onChange={(e) => { setLow(e.target.checked); setPage(1); }} className="accent-teal" /> Low stock only</label>
      } />
      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader title="Stock list" subtitle="Click a product to see its movements" />
          <Table>
            <thead><tr><Th>Product</Th><Th>Variants</Th><Th>Stock</Th><Th>Value</Th></tr></thead>
            <tbody>
              {products.loading && !products.data ? <EmptyRow colSpan={4}><Spinner /></EmptyRow> : !products.data?.data.length ? <EmptyRow colSpan={4}>No products</EmptyRow> : products.data.data.map((p) => (
                <tr key={p.id} className={cn("cursor-pointer hover:bg-surface/60", productId === p.id && "bg-teal-50/50")} onClick={() => setProductId(p.id)}>
                  <Td><button type="button" className="text-left font-medium text-navy hover:text-teal-dark" onClick={() => setProductId(p.id)}>{p.name}</button><span className="font-display block text-xs text-muted">{p.sku}</span></Td>
                  <Td className="text-xs">{p.variants?.length ? p.variants.map((v) => <span key={v.id} className={cn("mr-1 mb-1 inline-block rounded px-1.5 py-0.5", v.stock <= 2 ? "bg-rose-50 text-rose-700" : "bg-surface")}>{v.name}: {v.stock}</span>) : "—"}</Td>
                  <Td><span className={cn("font-display rounded-md px-2 py-0.5 text-xs font-bold", p.stock === 0 ? "bg-rose-50 text-rose-700" : p.stock <= 5 ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700")}>{p.stock}</span></Td>
                  <Td className="font-display text-xs">{money((p.cost_price ?? 0) * p.stock)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {products.data?.meta && <AdminPager page={products.data.meta.current_page} last={products.data.meta.last_page} total={products.data.meta.total} onPage={setPage} />}
        </Card>
        <Card>
          <CardHeader title="Stock movements" action={productId ? <button type="button" className="text-sm text-teal-dark hover:underline" onClick={() => setProductId(null)}>Show all</button> : <Link href="/admin/purchases" className="text-sm text-teal-dark hover:underline">+ Purchase</Link>} />
          <ul className="divide-y divide-line">
            {moves.loading && !moves.data ? <li className="p-4"><Spinner /></li> : !moves.data?.data.length ? <li className="p-4 text-sm text-muted">No movements</li> : moves.data.data.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <Badge tone={m.quantity > 0 ? "green" : "red"} className="font-display">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</Badge>
                <span className="min-w-0 flex-1"><span className="block truncate font-medium text-navy">{m.product?.name}{m.variant ? ` (${m.variant})` : ""}</span><span className="text-xs text-muted capitalize">{m.type} · {m.note}</span></span>
                <span className="text-xs text-muted">{formatDate(m.created_at)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
