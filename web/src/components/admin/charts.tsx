"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn, money, STATUS_LABELS } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

// Validated categorical palette (dataviz reference instance), assigned to statuses in a FIXED order
// so a status always keeps its colour regardless of which statuses are present.
const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
const STATUS_ORDER: Array<OrderStatus | "other"> = ["pending", "confirmed", "processing", "shipped", "delivered", "returned", "cancelled", "other"];
export const statusColor = (s: string) => SERIES[STATUS_ORDER.indexOf(STATUS_ORDER.includes(s as OrderStatus) ? (s as OrderStatus) : "other")];

const axis = { fontSize: 11, fill: "#64748b" };
const shortDate = (d: string) => {
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? d : x.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

/** Sales overview: one measure at a time (no dual axis) — toggle Revenue / Orders. */
export function SalesChart({ data }: { data: Array<{ date: string; orders: number; revenue: number }> }) {
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue");
  const total = data.reduce((a, b) => a + (metric === "revenue" ? b.revenue : b.orders), 0);
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          {metric === "revenue" ? "Total sales" : "Total orders"}: <span className="font-display text-base font-bold text-navy">{metric === "revenue" ? money(total) : total}</span>
        </p>
        <div className="inline-flex rounded-lg border border-line p-0.5" role="group" aria-label="Metric">
          {(["revenue", "orders"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={metric === m} onClick={() => setMetric(m)} className={cn("rounded-md px-3 py-1 text-xs font-semibold capitalize", metric === m ? "bg-navy text-white" : "text-navy")}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64" role="img" aria-label={`Daily ${metric} bar chart`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap={2}>
            <CartesianGrid vertical={false} stroke="#EEF2F7" />
            <XAxis dataKey="date" tickFormatter={shortDate} tick={axis} axisLine={false} tickLine={false} minTickGap={12} />
            <YAxis tick={axis} axisLine={false} tickLine={false} width={metric === "revenue" ? 56 : 32} tickFormatter={(v) => (metric === "revenue" ? (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)) : String(v))} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "rgba(11,31,58,0.05)" }}
              formatter={(v) => [metric === "revenue" ? money(Number(v)) : String(v), metric === "revenue" ? "Revenue" : "Orders"]}
              labelFormatter={(l) => shortDate(String(l))}
              contentStyle={{ borderRadius: 12, border: "1px solid #DCE3EC", fontSize: 12 }}
            />
            <Bar dataKey={metric} fill={metric === "revenue" ? "#078080" : "#0B1F3A"} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function StatusDonut({ data }: { data: Array<{ status: string; count: number }> }) {
  // fold statuses outside the fixed order (partial, on_hold) into "other"
  const folded = new Map<string, number>();
  data.forEach((d) => {
    const k = STATUS_ORDER.includes(d.status as OrderStatus) ? d.status : "other";
    folded.set(k, (folded.get(k) ?? 0) + d.count);
  });
  const rows = STATUS_ORDER.filter((s) => folded.get(s)).map((s) => ({ status: s, count: folded.get(s)!, label: s === "other" ? "অন্যান্য" : STATUS_LABELS[s as OrderStatus] }));
  const total = rows.reduce((a, b) => a + b.count, 0);
  if (!total) return <p className="py-10 text-center text-sm text-muted">No orders in this range</p>;
  return (
    <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr]">
      <div className="relative mx-auto h-44 w-44" role="img" aria-label="Order status distribution">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="count" nameKey="label" innerRadius={52} outerRadius={80} paddingAngle={1} stroke="#fff" strokeWidth={2} isAnimationActive={false}>
              {rows.map((r) => <Cell key={r.status} fill={statusColor(r.status)} />)}
            </Pie>
            <Tooltip formatter={(v, n) => [String(v), String(n)]} contentStyle={{ borderRadius: 12, border: "1px solid #DCE3EC", fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <span><span className="font-display block text-2xl font-bold text-navy">{total}</span><span className="text-xs text-muted">orders</span></span>
        </div>
      </div>
      <ul className="space-y-1.5 text-sm">
        {rows.map((r) => (
          <li key={r.status} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: statusColor(r.status) }} aria-hidden="true" />
            <span className="flex-1 text-navy">{r.label}</span>
            <span className="font-display font-semibold text-navy">{r.count}</span>
            <span className="font-display w-10 text-right text-xs text-muted">{Math.round((r.count / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DailyBar({ data, dataKey, color = "#078080", label }: { data: Array<Record<string, number | string>>; dataKey: string; color?: string; label: string }) {
  return (
    <div className="h-64" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#EEF2F7" />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={axis} axisLine={false} tickLine={false} minTickGap={12} />
          <YAxis tick={axis} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
          <Tooltip cursor={{ fill: "rgba(11,31,58,0.05)" }} formatter={(v) => [money(Number(v)), label]} labelFormatter={(l) => shortDate(String(l))} contentStyle={{ borderRadius: 12, border: "1px solid #DCE3EC", fontSize: 12 }} />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
