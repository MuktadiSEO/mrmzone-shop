"use client";

import { useState } from "react";
import { useAdminQuery } from "@/lib/use-admin-query";
import { cn, money } from "@/lib/format";
import type { ProductReportRow, ReportSummary } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyRow, Table, Td, Th } from "@/components/ui/Table";
import { Alert, Spinner } from "@/components/ui/misc";
import { PageHeader } from "@/components/admin/common";
import { DailyBar } from "@/components/admin/charts";

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function ReportsPage() {
  const [from, setFrom] = useState(() => iso(new Date(Date.now() - 29 * 86400000)));
  const [to, setTo] = useState(() => iso(new Date()));
  const summary = useAdminQuery<ReportSummary | { data: ReportSummary }>("/reports/summary", { from, to });
  const products = useAdminQuery<{ data: ProductReportRow[] }>("/reports/products", { from, to });
  const s = summary.data ? ("data" in summary.data ? summary.data.data : summary.data) : null;

  const cards = s ? [
    ["Revenue", s.revenue, "text-navy"], ["COGS", s.cogs, "text-muted"], ["Gross profit", s.gross_profit, "text-teal-dark"],
    ["Expenses", s.expenses, "text-rose-600"], ["Net profit", s.net_profit, s.net_profit >= 0 ? "text-emerald-700" : "text-rose-600"],
  ] as const : [];

  return (
    <>
      <PageHeader title="Reports" subtitle="Profit & loss for delivered orders" actions={
        <div className="flex items-end gap-2">
          <label className="flex flex-col text-xs text-muted">From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-0.5 h-10 rounded-xl border border-line bg-white px-2 text-sm text-navy" /></label>
          <label className="flex flex-col text-xs text-muted">To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-0.5 h-10 rounded-xl border border-line bg-white px-2 text-sm text-navy" /></label>
        </div>
      } />
      {summary.error && <Alert>{summary.error}</Alert>}
      {!s ? <div className="py-16 text-center"><Spinner /></div> : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {cards.map(([label, v, c]) => (
              <Card key={label} className="p-4"><p className="text-sm text-muted">{label}</p><p className={cn("font-display mt-1 text-xl font-bold sm:text-2xl", c)}>{money(v)}</p></Card>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[["Orders", s.orders], ["Delivered", s.delivered], ["Returned", s.returned]].map(([l, v]) => (
              <Card key={l as string} className="p-3"><p className="font-display text-lg font-bold text-navy">{v}</p><p className="text-xs text-muted">{l}</p></Card>
            ))}
          </div>
          <Card>
            <CardHeader title="Daily revenue" subtitle={`Delivery charges collected: ${money(s.delivery_charges)}`} />
            <div className="p-4"><DailyBar data={s.by_day} dataKey="revenue" label="Revenue" /></div>
          </Card>
          <Card>
            <CardHeader title="Product report" />
            <Table>
              <thead><tr><Th>Product</Th><Th className="text-right">Qty sold</Th><Th className="text-right">Revenue</Th><Th className="text-right">Cost</Th><Th className="text-right">Profit</Th></tr></thead>
              <tbody>
                {products.loading && !products.data ? <EmptyRow colSpan={5}><Spinner /></EmptyRow> : !products.data?.data?.length ? <EmptyRow colSpan={5}>No sales in this range</EmptyRow> : products.data.data.map((r) => (
                  <tr key={r.id}>
                    <Td className="font-medium text-navy">{r.name}</Td>
                    <Td className="font-display text-right">{r.qty}</Td>
                    <Td className="font-display text-right">{money(r.revenue)}</Td>
                    <Td className="font-display text-right text-muted">{r.cost !== undefined ? money(r.cost) : "—"}</Td>
                    <Td className="font-display text-right font-semibold text-emerald-700">{r.profit !== undefined ? money(r.profit) : "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>
      )}
    </>
  );
}
