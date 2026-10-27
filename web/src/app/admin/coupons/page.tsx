"use client";

import { CrudPage } from "@/components/admin/CrudPage";
import { Badge } from "@/components/ui/Badge";
import { formatDate, money } from "@/lib/format";
import type { Coupon } from "@/lib/types";

export default function CouponsPage() {
  return (
    <CrudPage<Coupon>
      title="Coupons"
      endpoint="/coupons"
      columns={[
        { key: "code", label: "Code", render: (c) => <span className="font-display font-bold text-navy">{c.code}</span> },
        { key: "value", label: "Discount", render: (c) => <span className="font-display">{c.type === "percent" ? `${c.value}%` : money(c.value)}{c.max_discount ? ` (max ${money(c.max_discount)})` : ""}</span> },
        { key: "min_order", label: "Min order", render: (c) => <span className="font-display">{money(c.min_order)}</span> },
        { key: "used", label: "Used", render: (c) => <span className="font-display">{c.used}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</span> },
        { key: "ends_at", label: "Validity", render: (c) => (c.starts_at || c.ends_at ? `${formatDate(c.starts_at)} – ${formatDate(c.ends_at)}` : "Always") },
        { key: "is_active", label: "Status", render: (c) => (c.is_active ? <Badge tone="green">Active</Badge> : <Badge>Inactive</Badge>) },
      ]}
      defaults={{ type: "percent", is_active: true, min_order: 0, used: 0 }}
      toBody={(v) => ({ ...v, code: String(v.code ?? "").toUpperCase() })}
      fields={[
        { name: "code", label: "Code", required: true },
        { name: "type", label: "Type", type: "select", options: [{ value: "percent", label: "Percent (%)" }, { value: "fixed", label: "Fixed (৳)" }], required: true },
        { name: "value", label: "Value", type: "number", required: true },
        { name: "min_order", label: "Minimum order (৳)", type: "number" },
        { name: "max_discount", label: "Max discount (৳)", type: "number" },
        { name: "usage_limit", label: "Usage limit", type: "number" },
        { name: "starts_at", label: "Starts at", type: "datetime" },
        { name: "ends_at", label: "Ends at", type: "datetime" },
        { name: "is_active", label: "Active", type: "checkbox" },
      ]}
    />
  );
}
