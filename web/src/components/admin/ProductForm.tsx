"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Save, Wand2, X } from "lucide-react";
import { adminApi, ApiError, errorMessage } from "@/lib/api";
import { useAdminQuery } from "@/lib/use-admin-query";
import type { AdminProduct, Brand, Category, Paginated, ProductVariant } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/misc";
import { GalleryUpload, ImageUpload } from "./common";
import { useToast } from "./Toast";

type VariantRow = Omit<ProductVariant, "id"> & { id?: number };

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

function TagInput({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [v, setV] = useState("");
  const add = () => {
    const parts = v.split(",").map((x) => x.trim()).filter(Boolean).filter((x) => !values.includes(x));
    if (parts.length) onChange([...values, ...parts]);
    setV("");
  };
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-navy">{label}</span>
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-line bg-white p-1.5 focus-within:border-teal">
        {values.map((x) => (
          <span key={x} className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2 py-1 text-sm text-teal-dark">
            {x}
            <button type="button" onClick={() => onChange(values.filter((y) => y !== x))} aria-label={`Remove ${x}`}><X className="h-3.5 w-3.5" /></button>
          </span>
        ))}
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
          onBlur={add}
          placeholder={placeholder}
          aria-label={label}
          className="h-8 min-w-[120px] flex-1 px-1.5 text-sm focus:outline-none"
        />
      </div>
    </div>
  );
}

export function ProductForm({ id }: { id?: string }) {
  const router = useRouter();
  const toast = useToast();
  const existing = useAdminQuery<{ data: AdminProduct }>(id ? `/products/${id}` : null);
  const cats = useAdminQuery<Paginated<Category>>("/categories", { per_page: 200 });
  const brands = useAdminQuery<Paginated<Brand>>("/brands", { per_page: 200 });

  const [f, setF] = useState({
    name: "", slug: "", sku: "", category_id: "", brand_id: "", price: 0, sale_price: "" as number | "", cost_price: "" as number | "",
    stock: 0, status: "active" as "active" | "draft", is_featured: false, badge: "", short_description: "", description: "",
    size_chart: "", video_url: "", meta_title: "", meta_description: "", image: null as string | null, images: [] as string[],
  });
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formErr, setFormErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = existing.data?.data;
    if (!p) return;
    setF({
      name: p.name, slug: p.slug, sku: p.sku ?? "", category_id: String(p.category_id ?? p.category?.id ?? ""), brand_id: String(p.brand_id ?? ""),
      price: p.price, sale_price: p.sale_price ?? "", cost_price: p.cost_price ?? "", stock: p.stock, status: p.status ?? "active",
      is_featured: !!p.is_featured, badge: p.badge ?? "", short_description: p.short_description ?? "", description: p.description ?? "",
      size_chart: p.size_chart ?? "", video_url: p.video_url ?? "", meta_title: p.meta_title ?? "", meta_description: p.meta_description ?? "",
      image: p.image, images: p.images ?? [],
    });
    setColors(p.options?.color ?? []);
    setSizes(p.options?.size ?? []);
    setVariants(p.variants ?? []);
  }, [existing.data]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const basePrice = Number(f.sale_price || f.price || 0);

  const generate = () => {
    const cs: Array<string | null> = colors.length ? colors : [null];
    const ss: Array<string | null> = sizes.length ? sizes : [null];
    if (!colors.length && !sizes.length) { setVariants([]); return; }
    const rows: VariantRow[] = [];
    for (const c of cs) for (const s of ss) {
      const attributes: Record<string, string> = {};
      if (c) attributes.color = c;
      if (s) attributes.size = s;
      const name = [c, s].filter(Boolean).join(" / ");
      const prev = variants.find((v) => v.name === name);
      rows.push(prev ?? { name, attributes, price: basePrice, stock: 0, sku: f.sku ? `${f.sku}-${[c, s].filter(Boolean).join("-")}`.toUpperCase().replace(/\s+/g, "") : null });
    }
    setVariants(rows);
  };

  const totalStock = useMemo(() => (variants.length ? variants.reduce((a, b) => a + Number(b.stock || 0), 0) : f.stock), [variants, f.stock]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setFormErr(null);
    const options: Record<string, string[]> = {};
    if (colors.length) options.color = colors;
    if (sizes.length) options.size = sizes;
    const body = {
      ...f,
      slug: f.slug || slugify(f.name) || undefined,
      category_id: f.category_id ? Number(f.category_id) : null,
      brand_id: f.brand_id ? Number(f.brand_id) : null,
      sale_price: f.sale_price === "" ? null : Number(f.sale_price),
      cost_price: f.cost_price === "" ? null : Number(f.cost_price),
      badge: f.badge || null,
      stock: totalStock,
      options,
      variants: variants.map((v) => ({ ...v, price: Number(v.price), stock: Number(v.stock) })),
    };
    try {
      const r = id ? await adminApi.put<{ data: AdminProduct }>(`/products/${id}`, body) : await adminApi.post<{ data: AdminProduct }>("/products", body);
      toast(id ? "Product updated" : "Product created");
      if (!id && r?.data?.id) router.replace(`/admin/products/${r.data.id}`);
      else existing.reload();
    } catch (err) {
      if (err instanceof ApiError) {
        const fe: Record<string, string> = {};
        Object.entries(err.errors || {}).forEach(([k, v]) => (fe[k] = v[0]));
        setErrors(fe);
      }
      setFormErr(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (id && existing.loading && !existing.data) return <p className="py-20 text-center text-muted">Loading…</p>;
  if (id && existing.error) return <Alert>{existing.error}</Alert>;

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-navy">{id ? `Edit: ${f.name}` : "New product"}</h2>
        <div className="flex gap-2">
          <ButtonLink href="/admin/products" variant="outline">Cancel</ButtonLink>
          {id && f.slug && <ButtonLink href={`/product/${f.slug}`} target="_blank" variant="ghost">View on site</ButtonLink>}
          <Button type="submit" variant="accent" loading={busy} icon={<Save className="h-4 w-4" />}>Save product</Button>
        </div>
      </div>
      {formErr && <Alert>{formErr}</Alert>}
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Basic info" />
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <Input label="Product name (বাংলা)" required value={f.name} onChange={(e) => set("name", e.target.value)} error={errors.name} wrapClassName="sm:col-span-2" />
              <Input label="Slug (URL)" value={f.slug} onChange={(e) => set("slug", e.target.value)} placeholder={slugify(f.name) || "fleece-hoodie"} error={errors.slug} hint="English letters, e.g. fleece-hoodie" />
              <Input label="SKU" value={f.sku} onChange={(e) => set("sku", e.target.value)} error={errors.sku} />
              <Textarea label="Short description" value={f.short_description} onChange={(e) => set("short_description", e.target.value)} rows={2} wrapClassName="sm:col-span-2" />
              <Textarea label="Description (HTML allowed)" value={f.description} onChange={(e) => set("description", e.target.value)} rows={7} wrapClassName="sm:col-span-2" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Images" />
            <div className="grid gap-4 p-4 sm:grid-cols-[auto_1fr]">
              <ImageUpload label="Main image" value={f.image} onChange={(u) => set("image", u)} />
              <GalleryUpload value={f.images} onChange={(v) => set("images", v)} />
              <Input label="Video URL (YouTube / Facebook)" value={f.video_url} onChange={(e) => set("video_url", e.target.value)} wrapClassName="sm:col-span-2" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Variants" subtitle="Colour × size matrix with its own price, stock and SKU" action={<Button size="sm" variant="soft" onClick={generate} icon={<Wand2 className="h-3.5 w-3.5" />}>Generate</Button>} />
            <div className="space-y-3 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <TagInput label="Colours (রং)" values={colors} onChange={setColors} placeholder="কালো, অ্যাশ… press Enter" />
                <TagInput label="Sizes (সাইজ)" values={sizes} onChange={setSizes} placeholder="M, L, XL… press Enter" />
              </div>
              {variants.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-line">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead className="bg-surface text-left text-xs text-muted uppercase"><tr><th className="px-3 py-2">Variant</th><th className="px-3 py-2">Price (৳)</th><th className="px-3 py-2">Stock</th><th className="px-3 py-2">SKU</th><th /></tr></thead>
                    <tbody>
                      {variants.map((v, i) => (
                        <tr key={v.name} className="border-t border-line">
                          <td className="px-3 py-1.5 font-medium text-navy">{v.name}</td>
                          <td className="px-3 py-1.5"><input aria-label={`${v.name} price`} type="number" value={v.price} onChange={(e) => setVariants((x) => x.map((y, j) => (j === i ? { ...y, price: Number(e.target.value) } : y)))} className="font-display h-8 w-24 rounded-lg border border-line px-2" /></td>
                          <td className="px-3 py-1.5"><input aria-label={`${v.name} stock`} type="number" value={v.stock} onChange={(e) => setVariants((x) => x.map((y, j) => (j === i ? { ...y, stock: Number(e.target.value) } : y)))} className="font-display h-8 w-20 rounded-lg border border-line px-2" /></td>
                          <td className="px-3 py-1.5"><input aria-label={`${v.name} SKU`} value={v.sku ?? ""} onChange={(e) => setVariants((x) => x.map((y, j) => (j === i ? { ...y, sku: e.target.value } : y)))} className="font-display h-8 w-36 rounded-lg border border-line px-2 text-xs" /></td>
                          <td className="px-2"><button type="button" onClick={() => setVariants((x) => x.filter((_, j) => j !== i))} aria-label={`Remove ${v.name}`} className="p-1 text-muted hover:text-rose-600"><X className="h-4 w-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted">No variants. Add colours/sizes and press Generate, or leave empty for a simple product.</p>
              )}
              <Textarea label="Size chart (HTML table)" value={f.size_chart} onChange={(e) => set("size_chart", e.target.value)} rows={3} className="font-mono text-xs" />
            </div>
          </Card>
          <Card>
            <CardHeader title="SEO" />
            <div className="grid gap-3 p-4">
              <Input label="Meta title" value={f.meta_title} onChange={(e) => set("meta_title", e.target.value)} hint={`${f.meta_title.length}/60`} />
              <Textarea label="Meta description" value={f.meta_description} onChange={(e) => set("meta_description", e.target.value)} rows={2} hint={`${f.meta_description.length}/160`} />
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Pricing & stock" />
            <div className="grid grid-cols-2 gap-3 p-4">
              <Input label="Regular price" type="number" required value={f.price} onChange={(e) => set("price", Number(e.target.value))} error={errors.price} className="font-display" />
              <Input label="Sale price" type="number" value={f.sale_price} onChange={(e) => set("sale_price", e.target.value === "" ? "" : Number(e.target.value))} error={errors.sale_price} className="font-display" />
              <Input label="Cost price" type="number" value={f.cost_price} onChange={(e) => set("cost_price", e.target.value === "" ? "" : Number(e.target.value))} hint="Used for profit reports" className="font-display" />
              <Input label="Stock" type="number" value={totalStock} disabled={variants.length > 0} onChange={(e) => set("stock", Number(e.target.value))} hint={variants.length ? "Sum of variants" : undefined} className="font-display" />
            </div>
          </Card>
          <Card>
            <CardHeader title="Organisation" />
            <div className="space-y-3 p-4">
              <Select label="Category" required value={f.category_id} onChange={(e) => set("category_id", e.target.value)} error={errors.category_id}>
                <option value="">Select category</option>
                {(cats.data?.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              <Select label="Brand" value={f.brand_id} onChange={(e) => set("brand_id", e.target.value)}>
                <option value="">No brand</option>
                {(brands.data?.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
              <Select label="Status" value={f.status} onChange={(e) => set("status", e.target.value as "active" | "draft")}>
                <option value="active">Active (visible)</option><option value="draft">Draft (hidden)</option>
              </Select>
              <Input label="Badge" value={f.badge} onChange={(e) => set("badge", e.target.value)} placeholder="Best Seller / New / Hot" />
              <Checkbox label="Featured product" checked={f.is_featured} onChange={(e) => set("is_featured", e.target.checked)} />
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
