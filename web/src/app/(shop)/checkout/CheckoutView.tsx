"use client";

import { ShieldCheck, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { Container } from "@/components/shop/Section";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, Spinner } from "@/components/ui/misc";

export function CheckoutView() {
  const { items, ready, clear } = useCart();
  if (!ready) return <Container className="py-16 text-center"><Spinner /></Container>;
  return (
    <Container className="py-4 sm:py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold sm:text-2xl">চেকআউট</h1>
        <p className="flex items-center gap-1.5 text-sm text-emerald-700"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> ক্যাশ অন ডেলিভারি · নিরাপদ অর্ডার</p>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={<ShoppingBag className="h-7 w-7" />} title="কার্টে কোনো পণ্য নেই" text="অর্ডার করতে আগে পণ্য কার্টে যোগ করুন।" action={<ButtonLink href="/products" variant="accent">পণ্য দেখুন</ButtonLink>} />
      ) : (
        <CheckoutForm lines={items} onSuccess={() => clear()} />
      )}
    </Container>
  );
}
