import type { Metadata } from "next";
import { Suspense } from "react";
import { safe, shopApi } from "@/lib/api";
import type { Paginated, ProductCard } from "@/lib/types";
import { Breadcrumbs, Container } from "@/components/shop/Section";
import { ProductGrid } from "@/components/shop/ProductCard";
import { ListingFilters } from "@/components/shop/Listing";
import { Pagination } from "@/components/shop/Pagination";
import { EmptyState } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/Button";
import { PixelEvent } from "@/components/shop/MetaPixel";

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { search } = await searchParams;
  return search
    ? { title: `"${search}" — সার্চ ফলাফল`, robots: { index: false } }
    : { title: "সব পণ্য", alternates: { canonical: "/products" } };
}

export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || 1));
  const empty: Paginated<ProductCard> = { data: [], meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 } };
  const res = await safe(
    shopApi.products({ search: sp.search, category: sp.category, sort: sp.sort, min_price: sp.min_price, max_price: sp.max_price, page, per_page: 20 }),
    empty,
  );
  return (
    <Container>
      <Breadcrumbs items={[{ label: sp.search ? `সার্চ: ${sp.search}` : "সব পণ্য" }]} />
      <h1 className="mb-4 text-xl font-bold sm:text-2xl">{sp.search ? <>&ldquo;{sp.search}&rdquo; এর জন্য ফলাফল</> : "সব পণ্য"}</h1>
      {sp.search && <PixelEvent event="Search" params={{ search_string: sp.search }} />}
      <Suspense>
        <ListingFilters total={res.meta.total} />
      </Suspense>
      {res.data.length ? (
        <ProductGrid products={res.data} />
      ) : (
        <EmptyState
          title={sp.search ? "কোনো পণ্য পাওয়া যায়নি" : "এই মুহূর্তে কোনো পণ্য নেই"}
          text={sp.search ? "অন্য শব্দ দিয়ে খুঁজে দেখুন, অথবা আমাদের WhatsApp-এ জানান — আমরা খুঁজে দেব।" : "কিছুক্ষণ পরে আবার চেষ্টা করুন।"}
          action={<ButtonLink href="/" variant="accent">হোমে ফিরে যান</ButtonLink>}
        />
      )}
      <Pagination page={res.meta.current_page} last={res.meta.last_page} basePath="/products" params={sp} />
    </Container>
  );
}
