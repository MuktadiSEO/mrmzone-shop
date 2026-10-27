"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { ChevronRight, Heart, LayoutGrid, Menu, Phone, Search, ShoppingCart, Truck, User } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Modal } from "@/components/ui/Modal";
import { useCart } from "@/lib/cart";
import { useCategories, useSettings } from "@/lib/settings-context";
import { useCustomer } from "@/lib/customer-auth";
import { cn, toBanglaDigits } from "@/lib/format";
import { CategoryIcon } from "./CategoryIcon";
import { MiniCart } from "./MiniCart";
import { FacebookIcon, WhatsAppIcon } from "@/components/BrandIcons";

function SearchBoxInner({ className }: { className?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("search") ?? "");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const s = q.trim();
    router.push(s ? `/products?search=${encodeURIComponent(s)}` : "/products");
  };
  return (
    <form role="search" onSubmit={submit} className={cn("relative flex w-full", className)} action="/products">
      <label htmlFor="site-search" className="sr-only">পণ্য খুঁজুন</label>
      <input
        id="site-search"
        name="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        type="search"
        placeholder="পণ্য খুঁজুন… যেমন: হুডি, শাল, গ্লাভস"
        className="h-11 w-full rounded-xl border-2 border-teal/70 bg-white pr-14 pl-4 text-[0.95rem] text-navy placeholder:text-slate-400 focus:border-teal focus:outline-none"
      />
      <button type="submit" className="absolute top-1 right-1 bottom-1 grid w-12 place-items-center rounded-lg bg-teal text-white hover:bg-teal-dark" aria-label="খুঁজুন">
        <Search className="h-5 w-5" />
      </button>
    </form>
  );
}

export function SearchBox({ className }: { className?: string }) {
  return (
    <Suspense fallback={<div className={cn("h-11 w-full rounded-xl border-2 border-teal/40 bg-white", className)} />}>
      <SearchBoxInner className={className} />
    </Suspense>
  );
}

function IconLink({ href, label, children, badge, onClick }: { href?: string; label: string; children: React.ReactNode; badge?: number; onClick?: () => void }) {
  const inner = (
    <>
      <span className="relative">
        {children}
        {badge !== undefined && badge > 0 && (
          <span className="font-display absolute -top-2 -right-2.5 grid h-5 min-w-5 place-items-center rounded-full bg-sale px-1 text-[0.68rem] font-bold text-white">{badge > 99 ? "99+" : badge}</span>
        )}
      </span>
      <span className="hidden text-[0.72rem] font-medium lg:block">{label}</span>
    </>
  );
  const cls = "flex flex-col items-center gap-0.5 rounded-xl p-2 text-navy hover:bg-surface hover:text-teal-dark";
  if (href) return <Link href={href} className={cls} aria-label={label}>{inner}</Link>;
  return <button type="button" onClick={onClick} className={cls} aria-label={label}>{inner}</button>;
}

export function Header() {
  const settings = useSettings();
  const categories = useCategories();
  const { count, setOpen } = useCart();
  const { user } = useCustomer();
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {settings.announcement && (
        <div className="bg-navy text-white">
          <p className="mx-auto max-w-7xl truncate px-3 py-1.5 text-center text-[0.8rem] sm:text-sm">
            <span className="brand-gradient mr-2 hidden rounded px-1.5 py-0.5 text-[0.7rem] font-bold text-navy sm:inline-block">অফার</span>
            {settings.announcement}
          </p>
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:gap-4 sm:px-4 lg:py-3">
          <button type="button" className="rounded-xl p-2 text-navy hover:bg-surface lg:hidden" onClick={() => setMenu(true)} aria-label="মেনু খুলুন">
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/" className="shrink-0" aria-label="MRM Zone Shop হোম">
            <Logo size={38} />
          </Link>
          <SearchBox className="mx-2 hidden max-w-2xl flex-1 md:flex" />
          <nav aria-label="অ্যাকাউন্ট ও কার্ট" className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <a href={`tel:${settings.phone}`} className="mr-2 hidden items-center gap-2 xl:flex">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-teal-50 text-teal-dark"><Phone className="h-5 w-5" /></span>
              <span className="leading-tight">
                <span className="block text-[0.72rem] text-muted">হটলাইন</span>
                <span className="font-display block font-semibold text-navy">{settings.phone}</span>
              </span>
            </a>
            <span className="hidden sm:block"><IconLink href="/track-order" label="অর্ডার ট্র্যাক"><Truck className="h-6 w-6" /></IconLink></span>
            <span className="hidden sm:block"><IconLink href="/wishlist" label="উইশলিস্ট"><Heart className="h-6 w-6" /></IconLink></span>
            <IconLink href={user ? "/account" : "/login"} label={user ? "অ্যাকাউন্ট" : "লগইন"}><User className="h-6 w-6" /></IconLink>
            <IconLink label="কার্ট" badge={count} onClick={() => setOpen(true)}><ShoppingCart className="h-6 w-6" /></IconLink>
          </nav>
        </div>
        <div className="px-3 pb-2.5 md:hidden">
          <SearchBox />
        </div>
        <nav aria-label="ক্যাটাগরি" className="hidden bg-navy lg:block">
          <ul className="scrollbar-none mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4">
            <li>
              <Link href="/products" className="flex items-center gap-2 bg-teal px-4 py-2.5 text-sm font-semibold text-white">
                <LayoutGrid className="h-4 w-4" aria-hidden="true" /> সব পণ্য
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/category/${c.slug}`}
                  className={cn("flex items-center gap-2 px-3.5 py-2.5 text-sm whitespace-nowrap text-white/85 hover:text-cyan", pathname === `/category/${c.slug}` && "text-cyan")}
                >
                  <CategoryIcon name={c.icon} className="h-4 w-4" /> {c.name}
                </Link>
              </li>
            ))}
            <li className="ml-auto">
              <Link href="/track-order" className="flex items-center gap-2 px-3 py-2.5 text-sm whitespace-nowrap text-white/85 hover:text-cyan">
                <Truck className="h-4 w-4" aria-hidden="true" /> অর্ডার ট্র্যাক করুন
              </Link>
            </li>
          </ul>
        </nav>
        {/* mobile category chips */}
        <nav aria-label="ক্যাটাগরি (মোবাইল)" className="bg-navy lg:hidden">
          <ul className="scrollbar-none flex gap-1 overflow-x-auto px-2 py-1.5">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.8rem] whitespace-nowrap text-white/90 hover:bg-white/10">
                  <CategoryIcon name={c.icon} className="h-3.5 w-3.5 text-cyan" /> {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <MiniCart />

      <Modal open={menu} onClose={() => setMenu(false)} side="right" title="মেনু">
        <nav aria-label="মোবাইল মেনু" className="flex flex-col gap-1" onClick={(e) => (e.target as HTMLElement).closest("a") && setMenu(false)}>
          <p className="px-2 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">ক্যাটাগরি</p>
          {categories.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-navy hover:bg-surface">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-teal-50 text-teal-dark"><CategoryIcon name={c.icon} className="h-4.5 w-4.5" /></span>
              <span className="flex-1">{c.name}</span>
              {c.products_count ? <span className="font-display text-xs text-muted">{toBanglaDigits(c.products_count)}</span> : null}
              <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
            </Link>
          ))}
          <hr className="my-2 border-line" />
          {[
            ["/products", "সব পণ্য"], ["/track-order", "অর্ডার ট্র্যাক করুন"], ["/wishlist", "উইশলিস্ট"],
            [user ? "/account" : "/login", user ? "আমার অ্যাকাউন্ট" : "লগইন / রেজিস্টার"], ["/page/about", "আমাদের সম্পর্কে"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="rounded-xl px-2 py-2.5 text-navy hover:bg-surface">{label}</Link>
          ))}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#1fa855] py-2.5 text-sm font-semibold text-white">
              <WhatsAppIcon size={18} /> WhatsApp
            </a>
            <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#1877F2] py-2.5 text-sm font-semibold text-white">
              <FacebookIcon size={18} /> Facebook
            </a>
          </div>
          <a href={`tel:${settings.phone}`} className="font-display mt-2 flex items-center justify-center gap-2 rounded-xl border border-line py-2.5 font-semibold text-navy">
            <Phone className="h-4 w-4" /> {settings.phone}
          </a>
        </nav>
      </Modal>
    </>
  );
}
