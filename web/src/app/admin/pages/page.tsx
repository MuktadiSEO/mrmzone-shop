"use client";

import { ExternalLink } from "lucide-react";
import { CrudPage } from "@/components/admin/CrudPage";
import { Badge } from "@/components/ui/Badge";
import type { CmsPage } from "@/lib/types";

export default function CmsPagesPage() {
  return (
    <CrudPage<CmsPage & { id: number }>
      title="CMS Pages"
      subtitle="terms, privacy, return-policy, delivery-policy, about"
      endpoint="/pages"
      columns={[
        { key: "title", label: "Title", render: (p) => <span className="font-medium text-navy">{p.title}</span> },
        { key: "slug", label: "URL", render: (p) => <a href={`/page/${p.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-teal-dark hover:underline">/page/{p.slug}<ExternalLink className="h-3 w-3" /></a> },
        { key: "is_active", label: "Status", render: (p) => (p.is_active === false ? <Badge>Hidden</Badge> : <Badge tone="green">Published</Badge>) },
      ]}
      defaults={{ is_active: true }}
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "slug", label: "Slug", required: true },
        { name: "is_active", label: "Published", type: "checkbox" },
        { name: "content", label: "Content (HTML)", type: "html", required: true },
      ]}
    />
  );
}
