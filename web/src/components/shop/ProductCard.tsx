"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { shopApi } from "@/lib/api";
import { Heart, ShoppingCart, Star, Zap } from "lucide-react";
import type { ProductCard as Card } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/format";
import { Price } from "@/components/ui/Price";
import { ProductImage } from "./ProductImage";

/** ProductCard (list shape) may carry an optional `has_variants` flag. When the API omits it we fetch the
 *  product detail on click so a variant product always goes to its page for colour/size selection. */
export function ProductCard({ product, priority = false }: { product: Card; priority?: boolean }) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const href = `/product/${product.slug}`;
  const wished = has(product.id);

  const toCart = async (buyNow: boolean) => {
    let mustChoose = product.has_variants;
    if (mustChoose === undefined) {
      setBusy(true);
      try {
        const r = await shopApi.product(product.slug);
        mustChoose = (r.data.variants?.length ?? 0) > 0;
      } catch {
        mustChoose = false;
      } finally {
        setBusy(false);
      }
    }
    if (mustChoose) {
      router.push(href + (buyNow ? "?buy=1" : ""));
      return;
    }
    add({ product_id: product.id, variant_id: null, slug: product.slug, name: product.name, variant: null, image: product.image, price: product.final_price }, { silent: buyNow });
    if (buyNow) router.push("/checkout");
  };

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-shadow hover:shadow-pop">
      <Link href={href} className="relative block aspect-square overflow-hidden bg-surface" aria-label={product.name}>
        <ProductImage src={product.image} alt={product.name} seed={product.id} categorySlug={product.category?.slug} rounded="" eager={priority} className="transition-transform duration-300 group-hover:scale-[1.03]" />
        {product.discount_percent > 0 && (
          <span className="font-display absolute top-2 left-2 rounded-lg bg-sale px-2 py-0.5 text-xs font-bold text-white">-{product.discount_percent}%</span>
        )}
        {product.badge && (
          <span className="font-display absolute bottom-2 left-2 rounded-md bg-navy/90 px-2 py-0.5 text-[0.68rem] font-semibold tracking-wide text-white">{product.badge}</span>
        )}
        {!product.in_stock && <span className="absolute inset-0 grid place-items-center bg-white/70 text-sm font-bold text-navy">স্টক শেষ</span>}
      </Link>
      <button
        type="button"
        onClick={() => toggle(product)}
        aria-pressed={wished}
        aria-label={wished ? "উইশলিস্ট থেকে সরান" : "উইশলিস্টে যোগ করুন"}
        className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-navy shadow-sm hover:text-sale"
      >
        <Heart className={cn("h-4 w-4", wished && "fill-sale text-sale")} />
      </button>
      <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:p-3">
        <h3 className="line-clamp-2 min-h-[2.6em] text-[0.9rem] font-medium leading-snug text-navy sm:text-[0.95rem]">
          <Link href={href} className="hover:text-teal-dark">{product.name}</Link>
        </h3>
        {product.reviews_count > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="font-display font-medium text-navy">{product.rating.toFixed(1)}</span>
            <span>({product.reviews_count})</span>
          </div>
        )}
        <Price price={product.price} sale={product.sale_price ?? (product.final_price < product.price ? product.final_price : null)} size="sm" className="mt-auto" />
        <div className="mt-1 grid grid-cols-1 gap-1.5">
          <button
            type="button"
            disabled={!product.in_stock || busy}
            onClick={() => toCart(false)}
            className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-teal/40 bg-teal-50 px-1 text-[0.8rem] font-semibold text-teal-dark hover:bg-teal/15 disabled:opacity-50"
          >
            <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" /> কার্টে যোগ করুন
          </button>
          <button
            type="button"
            disabled={!product.in_stock || busy}
            onClick={() => toCart(true)}
            className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-navy px-1 text-[0.8rem] font-semibold text-white hover:bg-navy-700 disabled:opacity-50"
          >
            <Zap className="h-3.5 w-3.5" aria-hidden="true" /> এখনই কিনুন
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, className }: { products: Card[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5", className)}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}
