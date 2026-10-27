"use client";

import { CrudPage } from "@/components/admin/CrudPage";
import { Badge } from "@/components/ui/Badge";
import type { Brand } from "@/lib/types";

export default function BrandsPage() {
  return (
    <CrudPage<Brand>
      title="Brands"
      endpoint="/brands"
      columns={[
        { key: "logo", label: "Logo", render: (b) => (b.logo ? <img src={b.logo} alt="" className="h-9 w-9 rounded-lg object-cover" /> : <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface text-xs font-bold text-navy">{b.name.slice(0, 2)}</span>) },
        { key: "name", label: "Name", render: (b) => <span className="font-medium text-navy">{b.name}</span> },
        { key: "slug", label: "Slug" },
        { key: "is_active", label: "Status", render: (b) => (b.is_active === false ? <Badge>Hidden</Badge> : <Badge tone="green">Active</Badge>) },
      ]}
      defaults={{ is_active: true }}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "slug", label: "Slug" },
        { name: "is_active", label: "Active", type: "checkbox" },
        { name: "logo", label: "Logo", type: "image", full: true },
      ]}
    />
  );
}
