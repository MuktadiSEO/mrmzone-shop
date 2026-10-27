"use client";

import { CrudPage } from "@/components/admin/CrudPage";
import { CategoryIcon, CATEGORY_ICON_NAMES } from "@/components/shop/CategoryIcon";
import { Badge } from "@/components/ui/Badge";
import { useAdminQuery } from "@/lib/use-admin-query";
import type { Category, Paginated } from "@/lib/types";

export default function CategoriesPage() {
  const { data } = useAdminQuery<Paginated<Category>>("/categories", { per_page: 200 });
  const parents = (data?.data ?? []).filter((c) => !c.parent_id).map((c) => ({ value: c.id, label: c.name }));
  return (
    <CrudPage<Category>
      title="Categories"
      endpoint="/categories"
      columns={[
        { key: "name", label: "Name", render: (c) => <span className="flex items-center gap-2 font-medium text-navy"><span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-50 text-teal-dark"><CategoryIcon name={c.icon} className="h-4 w-4" /></span>{c.name}</span> },
        { key: "slug", label: "Slug", render: (c) => <code className="text-xs">{c.slug}</code> },
        { key: "parent_id", label: "Parent", render: (c) => parents.find((p) => p.value === c.parent_id)?.label ?? "—" },
        { key: "products_count", label: "Products", render: (c) => <span className="font-display">{c.products_count ?? 0}</span> },
        { key: "is_active", label: "Status", render: (c) => (c.is_active === false ? <Badge>Hidden</Badge> : <Badge tone="green">Active</Badge>) },
      ]}
      defaults={{ is_active: true, icon: "tag", sort_order: 0 }}
      toBody={(v) => ({ ...v, parent_id: v.parent_id ? Number(v.parent_id) : null })}
      fields={[
        { name: "name", label: "Name (বাংলা)", required: true },
        { name: "slug", label: "Slug", hint: "Leave empty to auto-generate" },
        { name: "icon", label: "Icon", type: "select", options: CATEGORY_ICON_NAMES.map((n) => ({ value: n, label: n })) },
        { name: "parent_id", label: "Parent category", type: "select", options: parents },
        { name: "sort_order", label: "Sort order", type: "number" },
        { name: "is_active", label: "Active", type: "checkbox" },
        { name: "image", label: "Image", type: "image", full: true },
      ]}
    />
  );
}
