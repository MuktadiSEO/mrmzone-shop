import Link from "next/link";
import { Flame, Sparkles, Tag } from "lucide-react";
import { safe, shopApi } from "@/lib/api";
import { getCategories } from "@/lib/server-data";
import type { HomeData } from "@/lib/types";
import { BannerArt, HeroSlider } from "@/components/shop/HeroSlider";
import { Container, SectionTitle } from "@/components/shop/Section";
import { ProductGrid } from "@/components/shop/ProductCard";
import { CategoryIcon } from "@/components/shop/CategoryIcon";
import { TrustStrip } from "@/components/shop/Footer";
import { EmptyState } from "@/components/ui/misc";
import { toBanglaDigits } from "@/lib/format";

export const revalidate = 60;

const sectionMeta: Record<string, { title: string; icon: typeof Flame; href: string; sub: string }> = {
  "best-sellers": { title: "টপ সেলিং", icon: Flame, href: "/products?sort=popular", sub: "সবচেয়ে বেশি বিক্রি হওয়া পণ্য" },
  "new-arrivals": { title: "নতুন এসেছে", icon: Sparkles, href: "/products?sort=latest", sub: "একদম নতুন কালেকশন" },
  deals: { title: "আজকের ডিল", icon: Tag, href: "/products?sort=price_asc", sub: "সীমিত সময়ের বিশেষ ছাড়" },
};

export default async function HomePage() {
  const empty: HomeData = { banners: [], categories: [], sections: [] };
  const [home, navCats] = await Promise.all([safe(shopApi.home(), empty), getCategories()]);
  const banners = home.banners ?? [];
  const slides = banners.filter((b) => b.position !== "side");
  const side = banners.filter((b) => b.position === "side");
  // when the API doesn't tag positions, use the last two banners as side banners on desktop
  const sideBanners = side.length ? side.slice(0, 2) : slides.length > 3 ? slides.slice(-2) : [];
  const mainSlides = side.length ? slides : slides.length > 3 ? slides.slice(0, -2) : slides;
  const categories = home.categories?.length ? home.categories : navCats;
  const sections = (home.sections ?? []).filter((s) => s.products?.length);

  return (
    <div className="space-y-8 pb-6 sm:space-y-10">
      <Container className="pt-3 sm:pt-5">
        {mainSlides.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
            <HeroSlider banners={mainSlides} />
            {sideBanners.length > 0 && (
              <div className="hidden grid-rows-2 gap-3 lg:grid">
                {sideBanners.map((b, i) => (
                  <Link key={b.id} href={b.link || "/products"} className="block overflow-hidden rounded-2xl">
                    <BannerArt banner={b} index={i + 1} variant="side" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-navy px-6 py-10 text-white sm:px-10">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">প্রয়োজনের সবকিছু, এক জায়গায়</h1>
            <p className="mt-2 text-white/80">মানসম্মত পণ্য · সাশ্রয়ী দাম · দ্রুত ডেলিভারি</p>
          </div>
        )}
        <h1 className="sr-only">MRM Zone Shop — প্রয়োজনের সবকিছু, এক জায়গায়</h1>
      </Container>

      {categories.length > 0 && (
        <Container>
          <SectionTitle title="ফিচার্ড ক্যাটাগরি" href="/products" />
          <ul className="scrollbar-none -mx-3 flex snap-x gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-6 sm:overflow-visible sm:px-0">
            {categories.map((c, i) => (
              <li key={c.id} className="w-[88px] shrink-0 snap-start sm:w-auto">
                <Link href={`/category/${c.slug}`} className="group flex flex-col items-center gap-2 rounded-2xl border border-line bg-white px-2 py-3 text-center transition hover:border-teal hover:shadow-card sm:py-5">
                  <span
                    className="grid h-14 w-14 place-items-center overflow-hidden rounded-full text-teal-dark transition group-hover:scale-105 sm:h-16 sm:w-16"
                    style={{ background: ["#E6F4F4", "#EEF0FF", "#E9F7FB", "#F1F4F8", "#FFF4EA", "#F3EEFB"][i % 6] }}
                  >
                    {c.image ? <img src={c.image} alt="" className="h-full w-full object-cover" /> : <CategoryIcon name={c.icon} className="h-7 w-7" strokeWidth={1.6} />}
                  </span>
                  <span className="text-[0.82rem] leading-tight font-semibold text-navy sm:text-sm">{c.name}</span>
                  {c.products_count ? <span className="-mt-1 text-[0.7rem] text-muted">{toBanglaDigits(c.products_count)}টি পণ্য</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {sections.length === 0 && (
        <Container>
          <EmptyState title="এই মুহূর্তে কোনো পণ্য দেখানো যাচ্ছে না" text="কিছুক্ষণ পরে আবার চেষ্টা করুন অথবা আমাদের হটলাইনে কল করুন।" />
        </Container>
      )}

      {sections.map((s, idx) => {
        const meta = sectionMeta[s.slug];
        const Icon = meta?.icon ?? Tag;
        return (
          <Container key={s.slug}>
            <SectionTitle
              title={<span className="inline-flex items-center gap-2">{s.title || meta?.title}<Icon className="h-5 w-5 text-teal" aria-hidden="true" /></span>}
              sub={meta?.sub}
              href={meta?.href ?? "/products"}
            />
            <ProductGrid products={s.products.slice(0, 10)} />
            {idx === 0 && (
              <div className="mt-8">
                <TrustStrip />
              </div>
            )}
          </Container>
        );
      })}
    </div>
  );
}
