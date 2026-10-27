"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import { Container } from "@/components/shop/Section";
import { ProductGrid } from "@/components/shop/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/misc";

export function WishlistView() {
  const { items } = useWishlist();
  return (
    <Container className="py-6">
      <h1 className="mb-4 text-xl font-bold sm:text-2xl">উইশলিস্ট</h1>
      {items.length === 0 ? (
        <EmptyState icon={<Heart className="h-7 w-7" />} title="উইশলিস্ট খালি" text="পছন্দের পণ্যে ♥ চাপুন, পরে এখানে খুঁজে পাবেন।" action={<ButtonLink href="/products" variant="accent">পণ্য দেখুন</ButtonLink>} />
      ) : (
        <ProductGrid products={items} />
      )}
    </Container>
  );
}
