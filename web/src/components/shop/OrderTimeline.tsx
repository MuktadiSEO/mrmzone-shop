import { Check, PackageCheck, PhoneCall, Truck, XCircle } from "lucide-react";
import type { Order } from "@/lib/types";
import { cn, formatDate, money, STATUS_LABELS, STATUS_TONE } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

const steps = [
  { key: "pending", label: "অর্ডার গ্রহণ", icon: Check },
  { key: "confirmed", label: "কনফার্মড", icon: PhoneCall },
  { key: "shipped", label: "কুরিয়ারে", icon: Truck },
  { key: "delivered", label: "ডেলিভারড", icon: PackageCheck },
];
const rank: Record<string, number> = { pending: 0, on_hold: 0, confirmed: 1, processing: 1, shipped: 2, partial: 3, delivered: 3 };

export function OrderTracker({ order }: { order: Order }) {
  const failed = order.status === "cancelled" || order.status === "returned";
  const current = rank[order.status] ?? 0;
  return (
    <div className="rounded-2xl border border-line bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-muted">অর্ডার নম্বর</p>
          <p className="font-display text-lg font-bold text-navy">{order.number}</p>
        </div>
        <Badge tone={STATUS_TONE[order.status] ?? "gray"}>{order.status_label || STATUS_LABELS[order.status]}</Badge>
      </div>
      {failed ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"><XCircle className="h-5 w-5" aria-hidden="true" /> এই অর্ডারটি {STATUS_LABELS[order.status]} হয়েছে।</p>
      ) : (
        <ol className="mt-6 grid grid-cols-4">
          {steps.map((s, i) => {
            const done = i <= current;
            const Icon = s.icon;
            return (
              <li key={s.key} className="relative flex flex-col items-center text-center">
                {i > 0 && <span className={cn("absolute top-5 right-1/2 h-0.5 w-full", i <= current ? "bg-teal" : "bg-line")} aria-hidden="true" />}
                <span className={cn("relative z-10 grid h-10 w-10 place-items-center rounded-full border-2", done ? "border-teal bg-teal text-white" : "border-line bg-white text-muted")}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className={cn("mt-2 text-xs font-medium sm:text-sm", done ? "text-navy" : "text-muted")}>{s.label}</span>
              </li>
            );
          })}
        </ol>
      )}
      {order.tracking_code && (
        <p className="mt-5 rounded-xl bg-surface p-3 text-sm">
          কুরিয়ার: <b className="capitalize">{order.courier}</b> · ট্র্যাকিং কোড: <b className="font-display">{order.tracking_code}</b>
        </p>
      )}
      <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <h3 className="mb-1 font-semibold">পণ্যসমূহ</h3>
          <ul className="space-y-1">
            {order.items.map((it, i) => (
              <li key={i} className="flex justify-between gap-2"><span>{it.name}{it.variant ? ` (${it.variant})` : ""} × {it.quantity}</span><span className="font-display">{money(it.total)}</span></li>
            ))}
          </ul>
          <p className="mt-2 flex justify-between border-t border-line pt-2 font-semibold text-navy"><span>সর্বমোট</span><span className="font-display">{money(order.total)}</span></p>
        </div>
        <div>
          <h3 className="mb-1 font-semibold">আপডেট</h3>
          <ul className="space-y-2">
            {[...(order.history ?? [])].reverse().map((h, i) => (
              <li key={i} className="border-l-2 border-teal/40 pl-3">
                <p className="font-medium text-navy">{STATUS_LABELS[h.status as keyof typeof STATUS_LABELS] ?? h.status}</p>
                {h.note && <p className="text-muted">{h.note}</p>}
                <p className="text-xs text-muted">{formatDate(h.created_at, true)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
