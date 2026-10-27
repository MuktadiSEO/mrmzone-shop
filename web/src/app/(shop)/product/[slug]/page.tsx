import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiError, safe, shopApi, SITE_URL } from "@/lib/api";
import type { Paginated, Product, Review } from "@/lib/types";
import { Breadcrumbs, Container, SectionTitle } from "@/components/shop/Section";
import { ProductDetail } from "@/components/shop/ProductDetail";
import { ProductTabs } from "@/components/shop/ProductTabs";
import { ProductGrid } from "@/components/shop/ProductCard";
import { PixelEvent } from "@/components/shop/MetaPixel";
import { EmptyState } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/Button";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string): Promise<Product | null | "error"> {
  try {
    return (await shopApi.product(slug)).data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    return "error";
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await load(slug);
  if (!p || p === "error") return { title: "পণ্য" };
  const title = p.meta_title || p.name;
  const description = p.meta_description || p.short_description || `${p.name} — সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।`;
  return {
    title,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title, description, type: "website", url: `${SITE_URL}/product/${p.slug}`, images: p.images?.length ? p.images.slice(0, 4) : p.image ? [p.image] : undefined },
    other: { "product:price:amount": String(p.final_price), "product:price:currency": "BDT" },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await load(slug);
  if (product === null) notFound();
  if (product === "error") {
    return (
      <Container className="py-10">
        <EmptyState title="পণ্যের তথ্য লোড করা যাচ্ছে না" text="সার্ভারের সাথে সংযোগে সমস্যা হচ্ছে। কিছুক্ষণ পর আবার চেষ্টা করুন।" action={<ButtonLink href="/" variant="accent">হোমে ফিরে যান</ButtonLink>} />
      </Container>
    );
  }
  const emptyReviews: Paginated<Review> = { data: [], meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 } };
  const reviews = await safe(shopApi.reviews(slug), emptyReviews);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images?.length ? product.images : product.image ? [product.image] : undefined,
    description: product.meta_description || product.short_description || undefined,
    sku: product.sku || undefined,
    brand: { "@type": "Brand", name: "MRM Zone" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: "BDT",
      price: product.final_price,
      availability: product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(product.reviews_count > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviews_count } } : {}),
  };

  return (
    <Container className="pb-24 sm:pb-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PixelEvent event="ViewContent" params={{ content_ids: [String(product.id)], content_type: "product", content_name: product.name, value: product.final_price }} />
      <Breadcrumbs
        items={[
          ...(product.category ? [{ href: `/category/${product.category.slug}`, label: product.category.name }] : [{ href: "/products", label: "সব পণ্য" }]),
          { label: product.name },
        ]}
      />
      <ProductDetail product={product} />
      <ProductTabs slug={product.slug} description={product.description} reviews={reviews} rating={product.rating} reviewsCount={product.reviews_count} />
      {product.related?.length > 0 && (
        <section className="mt-10">
          <SectionTitle title="সম্পর্কিত পণ্য" href={product.category ? `/category/${product.category.slug}` : "/products"} />
          <ProductGrid products={product.related.slice(0, 10)} />
        </section>
      )}
    </Container>
  );
}
