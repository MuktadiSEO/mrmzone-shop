"use client";

import type { Order, OrderStatus } from "@/lib/types";
import { ORDER_STATUSES, STATUS_LABELS } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { statusColor } from "./charts";

export function CourierBadge({ order }: { order: Pick<Order, "courier" | "tracking_code" | "courier_status"> }) {
  if (!order.courier) return <span className="text-xs text-muted">—</span>;
  return (
    <span className="flex flex-col gap-0.5">
      <Badge tone="indigo" className="w-fit capitalize">{order.courier}</Badge>
      {order.tracking_code && <span className="font-display text-xs text-navy">{order.tracking_code}</span>}
      {order.courier_status && <span className="text-[0.7rem] text-muted">{order.courier_status.replace(/_/g, " ")}</span>}
    </span>
  );
}

export function StatusSelect({ value, onChange, disabled }: { value: OrderStatus; onChange: (s: OrderStatus) => void; disabled?: boolean }) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Change status</span>
      <span className="pointer-events-none absolute left-2.5 h-2 w-2 rounded-full" style={{ background: statusColor(value) }} aria-hidden="true" />
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as OrderStatus)}
        className="h-8 rounded-lg border border-line bg-white pr-7 pl-6 text-xs font-semibold text-navy focus:border-teal focus:outline-none"
      >
        {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </select>
    </label>
  );
}

