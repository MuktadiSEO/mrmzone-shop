import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ApiError, safe, shopApi } from "@/lib/api";
import { getCategories } from "@/lib/server-data";
import type { Category, Paginated, ProductCard } from "@/lib/types";
import { Breadcrumbs, Container } from "@/components/shop/Section";
import { ProductGrid } from "@/components/shop/ProductCard";
import { ListingFilters } from "@/components/shop/Listing";
import { Pagination } from "@/components/shop/Pagination";
import { EmptyState } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/Button";
import { CategoryIcon } from "@/components/shop/CategoryIcon";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

async function loadCategory(slug: string): Promise<Category | null> {
  try {
    return (await shopApi.category(slug)).data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    // API down: fall back to the cached nav list or a minimal stub so the page still renders
    const all = await getCategories();
    return all.find((c) => c.slug === slug) ?? { id: 0, name: slug, slug, icon: "tag", image: null, parent_id: null };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await loadCategory(slug);
  if (!c) return { title: "ক্যাটাগরি পাওয়া যায়নি" };
  return {
    title: c.name,
    description: `${c.name} — MRM Zone Shop-এ সেরা দামে কিনুন। সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।`,
    alternates: { canonical: `/category/${c.slug}` },
    openGraph: { title: `${c.name} | MRM Zone Shop`, images: c.image ? [c.image] : undefined },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await loadCategory(slug);
  if (!category) notFound();
  const page = Math.max(1, Number(sp.page || 1));
  const empty: Paginated<ProductCard> = { data: [], meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } };
  const res = await safe(
    shopApi.products({ category: slug, sort: sp.sort, min_price: sp.min_price, max_price: sp.max_price, page, per_page: 20 }),
    empty,
  );

  return (
    <Container>
      <Breadcrumbs items={[{ href: "/products", label: "সব পণ্য" }, { label: category.name }]} />
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-dark"><CategoryIcon name={category.icon} className="h-6 w-6" /></span>
        <h1 className="text-xl font-bold sm:text-2xl">{category.name}</h1>
      </div>
      {category.children && category.children.length > 0 && (
        <div className="scrollbar-none mb-3 flex gap-2 overflow-x-auto">
          {category.children.map((c) => (
            <ButtonLink key={c.id} href={`/category/${c.slug}`} size="sm" variant="outline">{c.name}</ButtonLink>
          ))}
        </div>
      )}
      <Suspense>
        <ListingFilters total={res.meta.total} />
      </Suspense>
      {res.data.length ? (
        <ProductGrid products={res.data} />
      ) : (
        <EmptyState title="এই ক্যাটাগরিতে কোনো পণ্য পাওয়া যায়নি" text="ফিল্টার পরিবর্তন করে দেখুন অথবা অন্য ক্যাটাগরি ঘুরে আসুন।" action={<ButtonLink href="/products" variant="accent">সব পণ্য দেখুন</ButtonLink>} />
      )}
      <Pagination page={res.meta.current_page} last={res.meta.last_page} basePath={`/category/${slug}`} params={sp} />
    </Container>
  );
}
