"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Check, Heart, Ruler, ShieldCheck, ShoppingCart, Star, Truck, Zap } from "lucide-react";
import type { Product, ProductVariant } from "@/lib/types";
import { SITE_URL } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useSettings } from "@/lib/settings-context";
import { cn, money, toBanglaDigits } from "@/lib/format";
import { Price } from "@/components/ui/Price";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MessengerIcon, WhatsAppIcon } from "@/components/BrandIcons";
import { ProductImage } from "./ProductImage";
import { QtyStepper } from "./MiniCart";

const OPTION_LABEL: Record<string, string> = { color: "রং", size: "সাইজ" };

export function messengerUrl(facebook: string) {
  try {
    const u = new URL(facebook);
    const handle = u.pathname.split("/").filter(Boolean)[0];
    return handle ? `https://m.me/${handle}` : facebook;
  } catch {
    return "https://m.me/mrmzoneshop";
  }
}

export function useVariantPicker(product: Product) {
  const options = useMemo(() => {
    const o = product.options && Object.keys(product.options).length ? product.options : {};
    if (Object.keys(o).length || !product.variants?.length) return o;
    // derive options from variants when the API omits `options`
    const derived: Record<string, string[]> = {};
    product.variants.forEach((v) => Object.entries(v.attributes || {}).forEach(([k, val]) => {
      derived[k] = derived[k] ?? [];
      if (!derived[k].includes(val)) derived[k].push(val);
    }));
    return derived;
  }, [product]);
  const keys = Object.keys(options);
  const [sel, setSel] = useState<Record<string, string>>(() => {
    // preselect single-valued options
    const init: Record<string, string> = {};
    keys.forEach((k) => options[k].length === 1 && (init[k] = options[k][0]));
    return init;
  });
  const hasVariants = (product.variants?.length ?? 0) > 0;
  const complete = keys.every((k) => sel[k]);
  const variant: ProductVariant | null = hasVariants && complete
    ? product.variants.find((v) => keys.every((k) => v.attributes?.[k] === sel[k])) ?? null
    : null;
  const valueAvailable = (key: string, value: string) =>
    !hasVariants || product.variants.some((v) => v.attributes?.[key] === value && v.stock > 0 && keys.every((k) => k === key || !sel[k] || v.attributes?.[k] === sel[k]));
  const price = variant?.price ?? product.final_price;
  const stock = hasVariants ? (variant ? variant.stock : null) : product.stock;
  return { options, keys, sel, setSel, variant, hasVariants, complete, valueAvailable, price, stock };
}

export function VariantPicker({ picker, error, onSizeChart }: { picker: ReturnType<typeof useVariantPicker>; error?: boolean; onSizeChart?: () => void }) {
  const { options, keys, sel, setSel, valueAvailable } = picker;
  if (!keys.length) return null;
  return (
    <div className="space-y-4">
      {keys.map((k) => (
        <fieldset key={k}>
          <legend className="mb-2 flex w-full items-center justify-between text-sm font-semibold text-navy">
            <span>
              {OPTION_LABEL[k] ?? k}: <span className="font-normal text-muted">{sel[k] ?? "বাছাই করুন"}</span>
            </span>
            {k === "size" && onSizeChart && (
              <button type="button" onClick={onSizeChart} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-dark hover:underline">
                <Ruler className="h-3.5 w-3.5" aria-hidden="true" /> সাইজ চার্ট
              </button>
            )}
          </legend>
          <div className="flex flex-wrap gap-2">
            {options[k].map((v) => {
              const active = sel[k] === v;
              const ok = valueAvailable(k, v);
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={active}
                  disabled={!ok}
                  onClick={() => setSel({ ...sel, [k]: v })}
                  className={cn(
                    "relative min-w-12 rounded-xl border-2 px-3.5 py-2 text-sm font-medium transition",
                    k === "size" && "font-display",
                    active ? "border-teal bg-teal-50 text-teal-dark" : "border-line bg-white text-navy hover:border-teal/60",
                    !ok && "cursor-not-allowed opacity-40 line-through",
                  )}
                >
                  {v}
                  {active && <Check className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-teal p-0.5 text-white" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      {error && <p role="alert" className="text-sm text-red-600">অনুগ্রহ করে {keys.filter((k) => !sel[k]).map((k) => OPTION_LABEL[k] ?? k).join(" ও ")} বাছাই করুন</p>}
    </div>
  );
}

export function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const settings = useSettings();
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const picker = useVariantPicker(product);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [showErr, setShowErr] = useState(false);
  const [chart, setChart] = useState(false);
  const images = product.images?.length ? product.images : product.image ? [product.image] : [];
  const slots = images.length ? images : [null, null, null];
  const inStock = picker.stock === null ? product.in_stock : picker.stock > 0;
  const compare = picker.variant ? (product.price > picker.price ? product.price : null) : product.sale_price !== null && product.sale_price !== undefined ? product.price : null;

  const addToCart = (buyNow: boolean) => {
    if (picker.hasVariants && !picker.variant) {
      setShowErr(true);
      document.getElementById("variant-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    add(
      {
        product_id: product.id,
        variant_id: picker.variant?.id ?? null,
        slug: product.slug,
        name: product.name,
        variant: picker.variant?.name ?? null,
        image: product.image,
        price: picker.price,
        quantity: qty,
        max: picker.stock ?? undefined,
      },
      { silent: buyNow },
    );
    if (buyNow) router.push("/checkout");
  };

  const orderText = encodeURIComponent(
    `আসসালামু আলাইকুম, আমি অর্ডার করতে চাই:\n${product.name}${picker.variant ? ` (${picker.variant.name})` : ""}\nপরিমাণ: ${qty}\nদাম: ${money(picker.price)}\nলিংক: ${SITE_URL}/product/${product.slug}`,
  );

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-10">
        {/* Gallery */}
        <div className="lg:sticky lg:top-36 lg:self-start">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-white">
            <ProductImage src={slots[img] ?? null} alt={product.name} seed={product.id + img} categorySlug={product.category?.slug} rounded="" eager label />
            {product.discount_percent > 0 && (
              <span className="font-display absolute top-3 left-3 rounded-lg bg-sale px-2.5 py-1 text-sm font-bold text-white">-{product.discount_percent}%</span>
            )}
          </div>
          {slots.length > 1 && (
            <div className="scrollbar-none mt-2.5 flex gap-2 overflow-x-auto" role="tablist" aria-label="পণ্যের ছবি">
              {slots.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={img === i}
                  aria-label={`ছবি ${i + 1}`}
                  onClick={() => setImg(i)}
                  className={cn("h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 sm:h-20 sm:w-20", img === i ? "border-teal" : "border-line")}
                >
                  <ProductImage src={src} alt="" seed={product.id + i} categorySlug={product.category?.slug} rounded="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            {product.badge && <span className="font-display mb-2 inline-block rounded-md bg-navy px-2 py-0.5 text-xs font-semibold text-white">{product.badge}</span>}
            <h1 className="text-xl leading-snug font-bold sm:text-[1.7rem]">{product.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              {product.reviews_count > 0 && (
                <a href="#reviews" className="flex items-center gap-1 hover:text-teal-dark">
                  <span className="flex" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={cn("h-4 w-4", s <= Math.round(product.rating) ? "fill-amber-400 text-amber-400" : "text-line")} />)}
                  </span>
                  <span className="font-display">{product.rating.toFixed(1)}</span> ({toBanglaDigits(product.reviews_count)} রিভিউ)
                </a>
              )}
              {product.sku && <span>SKU: <span className="font-display">{picker.variant?.sku ?? product.sku}</span></span>}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-4">
            <Price price={compare ?? picker.price} sale={compare ? picker.price : null} size="lg" />
            {compare && <p className="mt-1 text-sm font-medium text-sale">আপনি সাশ্রয় করছেন {money(compare - picker.price)}</p>}
            <p className={cn("mt-2 inline-flex items-center gap-1.5 text-sm font-medium", inStock ? "text-emerald-700" : "text-red-600")}>
              <span className={cn("h-2 w-2 rounded-full", inStock ? "bg-emerald-500" : "bg-red-500")} aria-hidden="true" />
              {inStock ? (picker.stock !== null && picker.stock <= 5 ? `স্টকে আছে — মাত্র ${toBanglaDigits(picker.stock)}টি বাকি!` : "স্টকে আছে") : "স্টক শেষ"}
            </p>
          </div>

          {product.short_description && <p className="text-[0.95rem] text-ink">{product.short_description}</p>}

          <div id="variant-picker">
            <VariantPicker picker={picker} error={showErr && !picker.complete} onSizeChart={product.size_chart ? () => setChart(true) : undefined} />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-navy">পরিমাণ:</span>
            <QtyStepper value={qty} onChange={setQty} max={picker.stock ?? undefined} size="md" />
          </div>

          <div className="hidden grid-cols-2 gap-2.5 sm:grid">
            <Button size="lg" variant="soft" className="border border-teal/40" onClick={() => addToCart(false)} disabled={!inStock} icon={<ShoppingCart className="h-5 w-5" />}>কার্টে যোগ করুন</Button>
            <Button size="lg" variant="primary" onClick={() => addToCart(true)} disabled={!inStock} icon={<Zap className="h-5 w-5" />}>এখনই কিনুন</Button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <a href={`https://wa.me/${settings.whatsapp}?text=${orderText}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1fa855] text-sm font-semibold text-white hover:bg-[#178c46]">
              <WhatsAppIcon size={20} /> WhatsApp অর্ডার
            </a>
            <a href={messengerUrl(settings.facebook)} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0866FF] text-sm font-semibold text-white hover:bg-[#0756d6]">
              <MessengerIcon size={20} /> Messenger
            </a>
          </div>
          <a href={`tel:${settings.phone}`} className="text-center text-sm text-muted">
            কল করে অর্ডার করুন: <span className="font-display font-semibold text-navy">{settings.phone}</span>
          </a>

          <button type="button" onClick={() => toggle(product)} className="inline-flex items-center gap-2 self-start text-sm font-medium text-navy hover:text-sale" aria-pressed={has(product.id)}>
            <Heart className={cn("h-4 w-4", has(product.id) && "fill-sale text-sale")} aria-hidden="true" />
            {has(product.id) ? "উইশলিস্টে আছে" : "উইশলিস্টে যোগ করুন"}
          </button>

          <ul className="grid gap-2 rounded-2xl bg-teal-50/60 p-4 text-sm text-navy">
            <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-teal-dark" aria-hidden="true" /> ঢাকার ভিতরে ডেলিভারি <b className="font-display">{money(settings.delivery.inside_dhaka)}</b>, বাইরে <b className="font-display">{money(settings.delivery.outside_dhaka)}</b></li>
            {settings.delivery.free_delivery_min_qty > 0 && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-teal-dark" aria-hidden="true" /> {toBanglaDigits(settings.delivery.free_delivery_min_qty)}টি বা বেশি পণ্য অর্ডারে ডেলিভারি ফ্রি</li>}
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-dark" aria-hidden="true" /> পণ্য হাতে পেয়ে চেক করে মূল্য পরিশোধ করুন</li>
          </ul>
        </div>
      </div>

      {/* Sticky mobile buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 p-2.5 shadow-[0_-6px_20px_rgba(11,31,58,0.08)] backdrop-blur sm:hidden">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 leading-tight">
            <p className="font-display text-lg font-bold text-teal-dark">{money(picker.price * qty)}</p>
            {compare && <p className="font-display text-xs text-slate-400 line-through">{money(compare * qty)}</p>}
          </div>
          <button type="button" onClick={() => addToCart(false)} disabled={!inStock} aria-label="কার্টে যোগ করুন" className="grid h-11 w-12 place-items-center rounded-xl border border-teal/40 bg-teal-50 text-teal-dark disabled:opacity-50">
            <ShoppingCart className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => addToCart(true)} disabled={!inStock} className="inline-flex h-11 flex-[1.4] items-center justify-center gap-1.5 rounded-xl bg-navy px-3 font-semibold text-white disabled:opacity-50">
            <Zap className="h-4 w-4" aria-hidden="true" /> এখনই কিনুন
          </button>
        </div>
      </div>

      {product.size_chart && (
        <Modal open={chart} onClose={() => setChart(false)} title="সাইজ চার্ট" size="lg">
          <div className="prose-shop overflow-x-auto" dangerouslySetInnerHTML={{ __html: product.size_chart }} />
          <p className="mt-3 text-xs text-muted">মাপ ইঞ্চিতে। ±০.৫ ইঞ্চি পার্থক্য হতে পারে।</p>
        </Modal>
      )}
    </>
  );
}
