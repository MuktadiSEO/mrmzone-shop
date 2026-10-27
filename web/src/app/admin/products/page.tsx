"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { adminApi, errorMessage } from "@/lib/api";
import { useAdminQuery } from "@/lib/use-admin-query";
import { cn, money } from "@/lib/format";
import type { AdminProduct, Category, Paginated } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyRow, Table, Td, Th } from "@/components/ui/Table";
import { Alert, Spinner } from "@/components/ui/misc";
import { AdminPager, ConfirmButton, PageHeader } from "@/components/admin/common";
import { ProductImage } from "@/components/shop/ProductImage";
import { useToast } from "@/components/admin/Toast";

export default function ProductsPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [stock, setStock] = useState("");
  const cats = useAdminQuery<Paginated<Category>>("/categories", { per_page: 200 });
  const { data, loading, error, reload } = useAdminQuery<Paginated<AdminProduct>>("/products", { page, search: q, category_id: category, status, stock });

  const remove = async (p: AdminProduct) => {
    try {
      await adminApi.del(`/products/${p.id}`);
      toast("Product deleted");
      reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  return (
    <>
      <PageHeader title="Products" actions={<ButtonLink href="/admin/products/new" variant="accent" icon={<Plus className="h-4 w-4" />}>Add product</ButtonLink>} />
      <Card>
        <div className="flex flex-wrap gap-2 border-b border-line p-3">
          <form className="flex min-w-[240px] flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(search); }}>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input aria-label="Search products" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or SKU" className="h-10 w-full rounded-xl border border-line pr-3 pl-9 text-sm focus:border-teal focus:outline-none" />
            </div>
            <Button type="submit" variant="outline">Search</Button>
          </form>
          <select aria-label="Category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="h-10 rounded-xl border border-line bg-white px-2 text-sm">
            <option value="">All categories</option>
            {(cats.data?.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-10 rounded-xl border border-line bg-white px-2 text-sm">
            <option value="">All status</option><option value="active">Active</option><option value="draft">Draft</option>
          </select>
          <select aria-label="Stock" value={stock} onChange={(e) => { setStock(e.target.value); setPage(1); }} className="h-10 rounded-xl border border-line bg-white px-2 text-sm">
            <option value="">All stock</option><option value="low">Low stock</option>
          </select>
        </div>
        {error && <div className="p-3"><Alert>{error}</Alert></div>}
        <Table>
          <thead><tr><Th>Product</Th><Th>Category</Th><Th>Price</Th><Th>Cost</Th><Th>Stock</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead>
          <tbody>
            {loading && !data ? <EmptyRow colSpan={7}><Spinner /></EmptyRow> : !data?.data.length ? <EmptyRow colSpan={7}>No products</EmptyRow> : data.data.map((p) => (
              <tr key={p.id} className="hover:bg-surface/60">
                <Td>
                  <div className="flex items-center gap-3">
                    <span className="h-11 w-11 shrink-0"><ProductImage src={p.image} alt="" seed={p.id} categorySlug={p.category?.slug} rounded="rounded-lg" /></span>
                    <span className="min-w-0">
                      <Link href={`/admin/products/${p.id}`} className="line-clamp-1 font-medium text-navy hover:text-teal-dark">{p.name}</Link>
                      <span className="font-display text-xs text-muted">{p.sku ?? "—"}{p.variants?.length ? ` · ${p.variants.length} variants` : ""}</span>
                    </span>
                  </div>
                </Td>
                <Td>{p.category?.name ?? "—"}</Td>
                <Td className="font-display whitespace-nowrap"><b>{money(p.final_price)}</b>{p.sale_price ? <del className="ml-1 text-xs text-muted">{money(p.price)}</del> : null}</Td>
                <Td className="font-display text-muted">{p.cost_price ? money(p.cost_price) : "—"}</Td>
                <Td><span className={cn("font-display rounded-md px-2 py-0.5 text-xs font-bold", p.stock === 0 ? "bg-rose-50 text-rose-700" : p.stock <= 5 ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700")}>{p.stock}</span></Td>
                <Td className="space-x-1">{p.status === "active" ? <Badge tone="green">Active</Badge> : <Badge>Draft</Badge>}{p.is_featured && <Badge tone="indigo">Featured</Badge>}</Td>
                <Td className="text-right">
                  <div className="inline-flex gap-1.5">
                    <ButtonLink href={`/admin/products/${p.id}`} size="sm" variant="outline" icon={<Pencil className="h-3.5 w-3.5" />}>Edit</ButtonLink>
                    <ConfirmButton size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" message={`Delete ${p.name}?`} onConfirm={() => remove(p)} aria-label="Delete"><Trash2 className="h-4 w-4" /></ConfirmButton>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {data?.meta && <AdminPager page={data.meta.current_page} last={data.meta.last_page} total={data.meta.total} onPage={setPage} />}
      </Card>
    </>
  );
}
