"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Ban, CircleDollarSign, Clock, FileClock, PackageCheck, PhoneCall, RotateCcw, ShoppingCart, TrendingUp, Truck,
} from "lucide-react";
import { useAdminQuery } from "@/lib/use-admin-query";
import type { DashboardData } from "@/lib/types";
import { cn, formatDate, money } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyRow, Table, Td, Th } from "@/components/ui/Table";
import { Alert, Spinner } from "@/components/ui/misc";
import { PageHeader, RangeSelect, StatusBadge } from "@/components/admin/common";
import { SalesChart, StatusDonut } from "@/components/admin/charts";
import { ProductImage } from "@/components/shop/ProductImage";

const CARDS = [
  { key: "total_orders", label: "Total orders", icon: ShoppingCart, tone: "bg-navy/8 text-navy", href: "/admin/orders" },
  { key: "pending", label: "Pending (নতুন)", icon: Clock, tone: "bg-amber-50 text-amber-700", href: "/admin/orders?status=pending" },
  { key: "confirmed", label: "Confirmed", icon: PhoneCall, tone: "bg-sky-50 text-sky-700", href: "/admin/orders?status=confirmed" },
  { key: "shipped", label: "On delivery", icon: Truck, tone: "bg-teal-50 text-teal-dark", href: "/admin/orders?status=shipped" },
  { key: "delivered", label: "Delivered", icon: PackageCheck, tone: "bg-emerald-50 text-emerald-700", href: "/admin/orders?status=delivered" },
  { key: "cancelled", label: "Cancelled", icon: Ban, tone: "bg-rose-50 text-rose-700", href: "/admin/orders?status=cancelled" },
  { key: "returned", label: "Returned", icon: RotateCcw, tone: "bg-rose-50 text-rose-700", href: "/admin/orders?status=returned" },
  { key: "incomplete", label: "Incomplete", icon: FileClock, tone: "bg-indigo-50 text-indigo-700", href: "/admin/incomplete-orders" },
  { key: "revenue", label: "Revenue", icon: CircleDollarSign, tone: "bg-teal-50 text-teal-dark", href: "/admin/reports", money: true },
  { key: "profit", label: "Profit", icon: TrendingUp, tone: "bg-emerald-50 text-emerald-700", href: "/admin/reports", money: true },
] as const;

export default function DashboardPage() {
  const [range, setRange] = useState("30d");
  const { data, loading, error } = useAdminQuery<DashboardData>("/dashboard", { range });

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Store overview" actions={<RangeSelect value={range} onChange={setRange} />} />
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {!data && loading ? (
        <div className="py-20 text-center"><Spinner /></div>
      ) : data ? (
        <div className={cn("space-y-4 transition-opacity", loading && "opacity-60")}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {CARDS.map((c) => {
              const Icon = c.icon;
              const v = data.cards[c.key as keyof DashboardData["cards"]] ?? 0;
              return (
                <Link key={c.key} href={c.href} className="group rounded-2xl border border-line bg-white p-4 shadow-card transition hover:border-teal">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-muted sm:text-sm">{c.label}</span>
                    <span className={cn("grid h-9 w-9 place-items-center rounded-xl", c.tone)}><Icon className="h-[18px] w-[18px]" aria-hidden="true" /></span>
                  </div>
                  <p className="font-display mt-1 text-xl font-bold text-navy sm:text-2xl">{"money" in c ? money(v) : v.toLocaleString("en-IN")}</p>
                </Link>
              );
            })}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <Card>
              <CardHeader title="Sales overview" subtitle="Daily orders & revenue" />
              <div className="p-4"><SalesChart data={data.sales_chart} /></div>
            </Card>
            <Card>
              <CardHeader title="Order status" />
              <div className="p-4"><StatusDonut data={data.status_breakdown} /></div>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <Card>
              <CardHeader title="Recent orders" action={<Link href="/admin/orders" className="text-sm font-semibold text-teal-dark hover:underline">View all</Link>} />
              <Table>
                <thead><tr><Th>Order</Th><Th>Customer</Th><Th>Total</Th><Th>Status</Th><Th>Date</Th></tr></thead>
                <tbody>
                  {data.recent_orders.length === 0 ? <EmptyRow colSpan={5}>No orders yet</EmptyRow> : data.recent_orders.map((o) => (
                    <tr key={o.id} className="hover:bg-surface/60">
                      <Td><Link href={`/admin/orders/${o.id}`} className="font-display font-semibold text-teal-dark hover:underline">{o.number}</Link></Td>
                      <Td>{o.customer_name}<span className="font-display block text-xs text-muted">{o.phone}</span></Td>
                      <Td className="font-display font-semibold">{money(o.total)}</Td>
                      <Td><StatusBadge status={o.status} label={o.status_label} /></Td>
                      <Td className="text-xs text-muted">{formatDate(o.created_at, true)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
            <div className="space-y-4">
              <Card>
                <CardHeader title="Top products" />
                <ul className="divide-y divide-line">
                  {data.top_products.length === 0 && <li className="p-4 text-sm text-muted">No sales yet</li>}
                  {data.top_products.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="font-display grid h-7 w-7 place-items-center rounded-lg bg-surface text-xs font-bold text-navy">{i + 1}</span>
                      <span className="flex-1 truncate text-sm font-medium text-navy">{p.name}</span>
                      <span className="font-display text-right text-xs text-muted">{p.qty} sold<span className="block font-semibold text-navy">{money(p.revenue)}</span></span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card>
                <CardHeader title="Low stock" action={<Link href="/admin/inventory" className="text-sm font-semibold text-teal-dark hover:underline">Inventory</Link>} />
                <ul className="divide-y divide-line">
                  {data.low_stock.length === 0 && <li className="p-4 text-sm text-muted">All products are well stocked</li>}
                  {data.low_stock.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="h-9 w-9 shrink-0"><ProductImage src={p.image} alt="" seed={p.id} categorySlug={p.category?.slug} rounded="rounded-lg" /></span>
                      <Link href={`/admin/products/${p.id}`} className="flex-1 truncate text-sm font-medium text-navy hover:text-teal-dark">{p.name}</Link>
                      <span className={cn("font-display rounded-md px-2 py-0.5 text-xs font-bold", (p.stock ?? 0) === 0 ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800")}>{p.stock ?? 0} left</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
