"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/lib/types";
import { cn } from "@/lib/format";
import { LogoMark } from "@/components/Logo";

const gradients = [
  "linear-gradient(120deg, #0B1F3A 0%, #12406B 55%, #078080 100%)",
  "linear-gradient(120deg, #066A6A 0%, #078080 45%, #22D3EE 140%)",
  "linear-gradient(120deg, #1B1F5E 0%, #3B3FB0 50%, #6366F1 100%)",
];

export function BannerArt({ banner, index, variant = "slide", priority }: { banner: Banner; index: number; variant?: "slide" | "side"; priority?: boolean }) {
  if (banner.image) {
    return <img src={banner.image} alt={banner.title} className="h-full w-full object-cover" loading={priority ? "eager" : "lazy"} />;
  }
  const side = variant === "side";
  return (
    <div className="relative flex h-full w-full items-center overflow-hidden" style={{ background: gradients[index % gradients.length] }}>
      <LogoMark size={side ? 160 : 340} color="rgba(255,255,255,0.08)" accent="rgba(34,211,238,0.18)" className={cn("pointer-events-none absolute", side ? "-right-8 -bottom-10" : "-right-10 -bottom-16 sm:right-4 sm:-bottom-10")} />
      <div className={cn("relative z-10 text-white", side ? "px-5" : "px-6 sm:px-10 lg:px-14")}>
        <p className={cn("brand-gradient mb-2 inline-block rounded-md px-2 py-0.5 font-bold text-navy", side ? "text-[0.65rem]" : "text-xs")}>MRM ZONE</p>
        <h2 className={cn("font-bold text-white", side ? "text-lg" : "text-2xl sm:text-4xl lg:text-[2.6rem]")}>{banner.title}</h2>
        {banner.subtitle && <p className={cn("mt-1.5 max-w-md text-white/85", side ? "text-xs" : "text-sm sm:text-lg")}>{banner.subtitle}</p>}
        {banner.button_text && (
          <span className={cn("mt-4 inline-flex items-center rounded-xl bg-white font-semibold text-navy", side ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm")}>{banner.button_text}</span>
        )}
      </div>
    </div>
  );
}

export function HeroSlider({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = banners.length;
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);
  const touch = useRef<number | null>(null);

  useEffect(() => {
    if (n < 2 || paused) return;
    const t = setInterval(() => go(1), 5000);
    return () => clearInterval(t);
  }, [n, paused, go]);

  if (n === 0) return null;
  return (
    <section
      aria-roledescription="carousel"
      aria-label="অফার ব্যানার"
      className="relative overflow-hidden rounded-2xl bg-navy"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
        {banners.map((b, idx) => (
          <Link
            key={b.id}
            href={b.link || "/products"}
            className="block aspect-[16/8] w-full shrink-0 sm:aspect-[16/7]"
            aria-roledescription="slide"
            aria-label={`${idx + 1} / ${n}: ${b.title}`}
            aria-hidden={idx !== i}
            tabIndex={idx === i ? 0 : -1}
          >
            <BannerArt banner={b} index={idx} priority={idx === 0} />
          </Link>
        ))}
      </div>
      {n > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} className="absolute top-1/2 left-2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-navy shadow sm:grid" aria-label="আগের ব্যানার">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => go(1)} className="absolute top-1/2 right-2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-navy shadow sm:grid" aria-label="পরের ব্যানার">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((b, idx) => (
              <button key={b.id} type="button" onClick={() => setI(idx)} aria-label={`ব্যানার ${idx + 1}`} aria-current={idx === i} className={cn("h-2 rounded-full transition-all", idx === i ? "w-6 bg-white" : "w-2 bg-white/50")} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
