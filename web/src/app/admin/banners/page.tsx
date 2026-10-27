"use client";

import { CrudPage } from "@/components/admin/CrudPage";
import { BannerArt } from "@/components/shop/HeroSlider";
import { Badge } from "@/components/ui/Badge";
import type { Banner } from "@/lib/types";

export default function BannersPage() {
  return (
    <CrudPage<Banner>
      title="Banners"
      subtitle="Home page slider and side banners"
      endpoint="/banners"
      searchable={false}
      columns={[
        { key: "image", label: "Preview", render: (b) => <div className="h-14 w-28 overflow-hidden rounded-lg"><BannerArt banner={b} index={b.id} variant="side" /></div> },
        { key: "title", label: "Title", render: (b) => <span className="font-medium text-navy">{b.title}<span className="block text-xs font-normal text-muted">{b.subtitle}</span></span> },
        { key: "position", label: "Position", render: (b) => <Badge tone={b.position === "side" ? "indigo" : "teal"}>{b.position ?? "slider"}</Badge> },
        { key: "link", label: "Link", render: (b) => <code className="text-xs">{b.link}</code> },
        { key: "is_active", label: "Status", render: (b) => (b.is_active === false ? <Badge>Hidden</Badge> : <Badge tone="green">Active</Badge>) },
      ]}
      defaults={{ position: "slider", is_active: true, sort_order: 0, button_text: "এখনই কিনুন" }}
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "subtitle", label: "Subtitle" },
        { name: "link", label: "Link", placeholder: "/category/seasonal" },
        { name: "button_text", label: "Button text" },
        { name: "position", label: "Position", type: "select", options: [{ value: "slider", label: "Main slider" }, { value: "side", label: "Side banner" }] },
        { name: "sort_order", label: "Sort order", type: "number" },
        { name: "is_active", label: "Active", type: "checkbox" },
        { name: "image", label: "Banner image (1600×700 recommended)", type: "image", full: true },
      ]}
    />
  );
}
