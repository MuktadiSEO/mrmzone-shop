"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2, X } from "lucide-react";
import { adminApi, errorMessage } from "@/lib/api";
import { useAdminQuery } from "@/lib/use-admin-query";
import { money } from "@/lib/format";
import type { LandingPage, LandingSection, LandingSectionType } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/misc";
import { ImageUpload } from "./common";
import { ProductPicker } from "./ProductPicker";
import { useToast } from "./Toast";

type Item = { title?: string; text?: string; question?: string; answer?: string; image?: string };
type Sec = { type: LandingSectionType; title: string; items: Item[] };

const toSec = (s: LandingSection): Sec => ({
  type: s.type, title: s.title,
  items: s.items.map((it) => (typeof it === "string" ? (s.type === "gallery" ? { image: it } : { text: it }) : it)),
});
const fromSec = (s: Sec): LandingSection => ({
  type: s.type, title: s.title,
  items: s.type === "gallery" ? s.items.map((i) => i.image ?? "") : s.type === "text" ? s.items.map((i) => i.text ?? "") : s.items,
});

export function LandingForm({ id }: { id?: string }) {
  const router = useRouter();
  const toast = useToast();
  const existing = useAdminQuery<{ data: LandingPage }>(id ? `/landing-pages/${id}` : null);
  const [f, setF] = useState({ title: "", slug: "", headline: "", subheadline: "", hero_image: null as string | null, video_url: "", offer_text: "", theme_color: "#078080", is_active: true });
  const [product, setProduct] = useState<{ id: number; name: string; price: number } | null>(null);
  const [sections, setSections] = useState<Sec[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const lp = existing.data?.data;
    if (!lp) return;
    setF({ title: lp.title, slug: lp.slug, headline: lp.headline, subheadline: lp.subheadline ?? "", hero_image: lp.hero_image, video_url: lp.video_url ?? "", offer_text: lp.offer_text ?? "", theme_color: lp.theme_color ?? "#078080", is_active: lp.is_active !== false });
    if (lp.product) setProduct({ id: lp.product.id, name: lp.product.name, price: lp.product.final_price });
    setSections((lp.sections ?? []).map(toSec));
  }, [existing.data]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const upd = (i: number, s: Partial<Sec>) => setSections((x) => x.map((y, j) => (j === i ? { ...y, ...s } : y)));
  const move = (i: number, d: number) => setSections((x) => { const a = [...x]; const [s] = a.splice(i, 1); a.splice(i + d, 0, s); return a; });

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!product) { setErr("Choose a product"); return; }
    setBusy(true);
    setErr(null);
    const body = { ...f, product_id: product.id, sections: sections.map(fromSec), video_url: f.video_url || null, offer_text: f.offer_text || null };
    try {
      const r = id ? await adminApi.put<{ data: LandingPage }>(`/landing-pages/${id}`, body) : await adminApi.post<{ data: LandingPage }>("/landing-pages", body);
      toast("Landing page saved");
      if (!id && r?.data?.id) router.replace(`/admin/landing-pages/${r.data.id}`);
    } catch (e2) {
      setErr(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-navy">{id ? "Edit landing page" : "New landing page"}</h2>
        <div className="flex gap-2">
          <ButtonLink href="/admin/landing-pages" variant="outline">Back</ButtonLink>
          {f.slug && <ButtonLink href={`/lp/${f.slug}`} target="_blank" variant="ghost">Preview</ButtonLink>}
          <Button type="submit" variant="accent" loading={busy} icon={<Save className="h-4 w-4" />}>Save</Button>
        </div>
      </div>
      {err && <Alert>{err}</Alert>}
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Hero" />
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <Input label="Internal title" required value={f.title} onChange={(e) => set("title", e.target.value)} />
              <Input label="Slug" required value={f.slug} onChange={(e) => set("slug", e.target.value)} hint={`mrmzone.shop/lp/${f.slug || "slug"}`} />
              <Input label="Headline (বাংলা)" required value={f.headline} onChange={(e) => set("headline", e.target.value)} wrapClassName="sm:col-span-2" />
              <Textarea label="Sub-headline" value={f.subheadline} onChange={(e) => set("subheadline", e.target.value)} rows={2} wrapClassName="sm:col-span-2" />
              <Input label="Offer text" value={f.offer_text} onChange={(e) => set("offer_text", e.target.value)} placeholder="অফার সীমিত সময়ের জন্য!" />
              <Input label="Video URL" value={f.video_url} onChange={(e) => set("video_url", e.target.value)} placeholder="YouTube / Facebook / .mp4" />
              <ImageUpload label="Hero image" value={f.hero_image} onChange={(u) => set("hero_image", u)} className="sm:col-span-2" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Sections" subtitle="Features, text, FAQ, gallery — shown in this order" action={
              <div className="flex gap-1">
                {(["features", "text", "faq", "gallery"] as LandingSectionType[]).map((t) => (
                  <Button key={t} size="sm" variant="soft" onClick={() => setSections((x) => [...x, { type: t, title: "", items: [{}] }])} icon={<Plus className="h-3 w-3" />}>{t}</Button>
                ))}
              </div>
            } />
            <div className="space-y-3 p-4">
              {sections.length === 0 && <p className="text-sm text-muted">No sections yet — add one above.</p>}
              {sections.map((s, i) => (
                <div key={i} className="rounded-xl border border-line p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-md bg-navy px-2 py-0.5 text-xs font-semibold text-white uppercase">{s.type}</span>
                    <input aria-label="Section title" value={s.title} onChange={(e) => upd(i, { title: e.target.value })} placeholder="Section title" className="h-9 flex-1 rounded-lg border border-line px-2 text-sm" />
                    <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up" className="p-1 text-muted disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" disabled={i === sections.length - 1} onClick={() => move(i, 1)} aria-label="Move down" className="p-1 text-muted disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setSections((x) => x.filter((_, j) => j !== i))} aria-label="Remove section" className="p-1 text-rose-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="space-y-2">
                    {s.items.map((it, k) => {
                      const setIt = (v: Item) => upd(i, { items: s.items.map((y, j) => (j === k ? { ...y, ...v } : y)) });
                      return (
                        <div key={k} className="flex items-start gap-2">
                          <div className="grid flex-1 gap-2 sm:grid-cols-2">
                            {s.type === "features" && <><input aria-label="Feature title" value={it.title ?? ""} onChange={(e) => setIt({ title: e.target.value })} placeholder="Title" className="h-9 rounded-lg border border-line px-2 text-sm" /><input aria-label="Feature text" value={it.text ?? ""} onChange={(e) => setIt({ text: e.target.value })} placeholder="Text" className="h-9 rounded-lg border border-line px-2 text-sm" /></>}
                            {s.type === "faq" && <><input aria-label="Question" value={it.question ?? ""} onChange={(e) => setIt({ question: e.target.value })} placeholder="Question" className="h-9 rounded-lg border border-line px-2 text-sm" /><input aria-label="Answer" value={it.answer ?? ""} onChange={(e) => setIt({ answer: e.target.value })} placeholder="Answer" className="h-9 rounded-lg border border-line px-2 text-sm" /></>}
                            {s.type === "text" && <textarea aria-label="Text (HTML allowed)" value={it.text ?? ""} onChange={(e) => setIt({ text: e.target.value })} rows={3} placeholder="Text (HTML allowed)" className="rounded-lg border border-line p-2 text-sm sm:col-span-2" />}
                            {s.type === "gallery" && <div className="sm:col-span-2"><ImageUpload label={`Image ${k + 1}`} value={it.image ?? null} onChange={(u) => setIt({ image: u ?? "" })} /></div>}
                          </div>
                          <button type="button" onClick={() => upd(i, { items: s.items.filter((_, j) => j !== k) })} aria-label="Remove item" className="p-2 text-muted hover:text-rose-600"><X className="h-4 w-4" /></button>
                        </div>
                      );
                    })}
                    <Button size="sm" variant="ghost" onClick={() => upd(i, { items: [...s.items, {}] })} icon={<Plus className="h-3.5 w-3.5" />}>Add item</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Product" />
            <div className="space-y-3 p-4">
              {product ? (
                <div className="flex items-center justify-between rounded-xl bg-teal-50 px-3 py-2 text-sm">
                  <span className="font-medium text-navy">{product.name}</span><span className="font-display">{money(product.price)}</span>
                </div>
              ) : <p className="text-sm text-muted">The inline order form sells this product.</p>}
              <ProductPicker onPick={({ product: p }) => setProduct({ id: p.id, name: p.name, price: p.final_price })} placeholder="Choose product…" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Appearance" />
            <div className="space-y-3 p-4">
              <Input label="Theme colour" type="color" value={f.theme_color} onChange={(e) => set("theme_color", e.target.value)} className="h-11 p-1" />
              <Select label="Quick colour" value="" onChange={(e) => e.target.value && set("theme_color", e.target.value)}>
                <option value="">Brand presets…</option><option value="#078080">Teal</option><option value="#0B1F3A">Navy</option><option value="#6366F1">Indigo</option><option value="#E11D48">Red (sale)</option>
              </Select>
              <Checkbox label="Live (visible)" checked={f.is_active} onChange={(e) => set("is_active", e.target.checked)} />
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
