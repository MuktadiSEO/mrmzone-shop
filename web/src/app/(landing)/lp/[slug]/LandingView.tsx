"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, ChevronDown, Truck, Zap } from "lucide-react";
import type { LandingPage, LandingSection } from "@/lib/types";
import { money, toBanglaDigits } from "@/lib/format";
import { useSettings } from "@/lib/settings-context";
import { Price } from "@/components/ui/Price";
import { ProductImage } from "@/components/shop/ProductImage";
import { useVariantPicker, VariantPicker } from "@/components/shop/ProductDetail";
import { QtyStepper } from "@/components/shop/MiniCart";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { PixelEvent } from "@/components/shop/MetaPixel";
import { Modal } from "@/components/ui/Modal";

export function videoEmbed(url: string | null | undefined): { type: "iframe" | "video"; src: string } | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}` };
    if (host.endsWith("youtube.com")) {
      const id = u.searchParams.get("v") || u.pathname.split("/").filter(Boolean).pop();
      return id ? { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}` } : null;
    }
    if (host.endsWith("facebook.com") || host === "fb.watch") return { type: "iframe", src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false` };
    if (/\.(mp4|webm)$/i.test(u.pathname)) return { type: "video", src: url };
  } catch {
    return null;
  }
  return null;
}

type Item = LandingSection["items"][number];
const itemTitle = (it: Item) => (typeof it === "string" ? it : it.title ?? it.question ?? "");
const itemText = (it: Item) => (typeof it === "string" ? "" : it.text ?? it.answer ?? "");
const itemImage = (it: Item) => (typeof it === "string" ? it : it.image ?? "");

function Section({ s, theme, seed }: { s: LandingSection; theme: string; seed: number }) {
  return (
    <section className="mx-auto max-w-5xl px-3 py-6 sm:py-8">
      {s.title && <h2 className="mb-4 text-center text-xl font-bold sm:text-2xl">{s.title}</h2>}
      {s.type === "features" && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {s.items.map((it, i) => (
            <li key={i} className="flex gap-3 rounded-2xl border border-line bg-white p-4">
              <BadgeCheck className="h-6 w-6 shrink-0" style={{ color: theme }} aria-hidden="true" />
              <span>
                <span className="block font-semibold text-navy">{itemTitle(it)}</span>
                {itemText(it) && <span className="block text-sm text-muted">{itemText(it)}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
      {s.type === "text" && (
        <div className="prose-shop mx-auto max-w-3xl rounded-2xl border border-line bg-white p-5 text-center text-base">
          {s.items.map((it, i) => (typeof it === "string" ? <div key={i} dangerouslySetInnerHTML={{ __html: it }} /> : <p key={i}><b>{itemTitle(it)}</b> {itemText(it)}</p>))}
        </div>
      )}
      {s.type === "gallery" && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {s.items.map((it, i) => (
            <div key={i} className="aspect-square overflow-hidden rounded-2xl border border-line">
              <ProductImage src={itemImage(it) || null} alt={`${s.title} ${i + 1}`} seed={seed + i} rounded="" />
            </div>
          ))}
        </div>
      )}
      {s.type === "faq" && (
        <div className="mx-auto max-w-3xl space-y-2">
          {s.items.map((it, i) => (
            <details key={i} className="group rounded-2xl border border-line bg-white p-4 open:shadow-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-navy">
                {itemTitle(it)}
                <ChevronDown className="h-5 w-5 shrink-0 transition group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="mt-2 text-sm text-ink">{itemText(it)}</p>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}

export function LandingView({ lp }: { lp: LandingPage }) {
  const settings = useSettings();
  const theme = lp.theme_color || "#078080";
  const product = lp.product;
  const picker = useVariantPicker(product);
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);
  const [zoom, setZoom] = useState(false);
  const video = videoEmbed(lp.video_url || product.video_url);
  const compare = product.price > picker.price ? product.price : null;

  const lines = useMemo(
    () => [{ product_id: product.id, variant_id: picker.variant?.id ?? null, name: product.name, variant: picker.variant?.name ?? null, image: product.image, price: picker.price, quantity: qty }],
    [product, picker.variant, picker.price, qty],
  );

  const scrollToOrder = () => document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const free = settings.delivery.free_delivery_min_qty;

  return (
    <div className="pb-20 sm:pb-0">
      <PixelEvent event="ViewContent" params={{ content_ids: [String(product.id)], content_type: "product", content_name: product.name, value: product.final_price }} />
      {/* Hero */}
      <section className="relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, #0B1F3A 0%, #0B1F3A 35%, ${theme} 130%)` }}>
        <div className="mx-auto grid max-w-5xl items-center gap-5 px-3 py-6 sm:py-10 md:grid-cols-2">
          <div className="order-2 md:order-1">
            {lp.offer_text && <p className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-cyan sm:text-sm">🔥 {lp.offer_text}</p>}
            <h1 className="text-2xl leading-snug font-bold text-white sm:text-4xl">{lp.headline}</h1>
            {lp.subheadline && <p className="mt-3 text-white/85 sm:text-lg">{lp.subheadline}</p>}
            <div className="mt-4 flex items-baseline gap-3 rounded-2xl bg-white/95 px-4 py-3 text-navy">
              <span className="text-sm font-medium">অফার মূল্য</span>
              <Price price={compare ?? picker.price} sale={compare ? picker.price : null} size="lg" />
            </div>
            <button type="button" onClick={scrollToOrder} className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-lg font-bold text-white shadow-pop sm:w-auto sm:px-10" style={{ backgroundColor: theme }}>
              <Zap className="h-5 w-5" aria-hidden="true" /> এখনই অর্ডার করুন
            </button>
            <p className="mt-3 flex items-center gap-2 text-sm text-white/80"><Truck className="h-4 w-4" aria-hidden="true" /> সারা বাংলাদেশে ক্যাশ অন ডেলিভারি{free > 0 ? ` · ${toBanglaDigits(free)}টি নিলে ডেলিভারি ফ্রি` : ""}</p>
          </div>
          <button type="button" onClick={() => setZoom(true)} className="order-1 aspect-square overflow-hidden rounded-3xl border-4 border-white/20 md:order-2" aria-label="ছবি বড় করে দেখুন">
            <ProductImage src={lp.hero_image || product.image} alt={product.name} seed={product.id} categorySlug={product.category?.slug} rounded="" eager label />
          </button>
        </div>
      </section>

      {video && (
        <section className="mx-auto max-w-3xl px-3 pt-6 sm:pt-8">
          <h2 className="sr-only">ভিডিও</h2>
          <div className="aspect-video overflow-hidden rounded-2xl border border-line bg-navy shadow-card">
            {video.type === "iframe" ? (
              <iframe src={video.src} title={`${product.name} ভিডিও`} className="h-full w-full" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            ) : (
              <video src={video.src} controls playsInline className="h-full w-full" />
            )}
          </div>
        </section>
      )}

      {(lp.sections ?? []).map((s, i) => <Section key={i} s={s} theme={theme} seed={product.id + i * 3} />)}

      {/* Order form */}
      <section id="order" className="scroll-mt-16 bg-white py-8">
        <div className="mx-auto max-w-3xl px-3">
          <h2 className="text-center text-2xl font-bold">অর্ডার করতে নিচের ফর্মটি পূরণ করুন</h2>
          <p className="mt-1 mb-5 text-center text-sm text-muted">পণ্য হাতে পেয়ে টাকা দিন — কোনো অগ্রিম পেমেন্ট নেই</p>
          {done ? null : (
            <CheckoutForm
              lines={lines}
              layout="stacked"
              accent={theme}
              onSuccess={() => setDone(true)}
              beforeSubmit={() => (picker.hasVariants && !picker.variant ? "অনুগ্রহ করে রং/সাইজ বাছাই করুন" : null)}
              summaryTop={
                <div className="space-y-4 rounded-2xl border-2 p-4" style={{ borderColor: theme }}>
                  <div className="flex items-center gap-3">
                    <span className="h-16 w-16 shrink-0"><ProductImage src={product.image} alt={product.name} seed={product.id} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-navy">{product.name}</span>
                      <span className="font-display text-lg font-bold" style={{ color: theme }}>{money(picker.price)}</span>
                    </span>
                  </div>
                  <VariantPicker picker={picker} />
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-navy">পরিমাণ:</span>
                    <QtyStepper value={qty} onChange={setQty} max={picker.stock ?? undefined} size="md" />
                  </div>
                </div>
              }
            />
          )}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 p-2.5 backdrop-blur sm:hidden">
        <button type="button" onClick={scrollToOrder} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-bold text-white" style={{ backgroundColor: theme }}>
          <Zap className="h-5 w-5" aria-hidden="true" /> অর্ডার করুন — <span className="font-display">{money(picker.price)}</span>
        </button>
      </div>

      <Modal open={zoom} onClose={() => setZoom(false)} title={product.name} size="lg">
        <div className="aspect-square"><ProductImage src={lp.hero_image || product.image} alt={product.name} seed={product.id} categorySlug={product.category?.slug} /></div>
      </Modal>
    </div>
  );
}
