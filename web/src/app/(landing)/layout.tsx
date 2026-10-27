import Link from "next/link";
import { Phone } from "lucide-react";
import { ShopProviders } from "@/components/shop/Providers";
import { MiniCart } from "@/components/shop/MiniCart";
import { Logo } from "@/components/Logo";
import { getCategories, getSettings } from "@/lib/server-data";

/** Minimal, distraction-free chrome for Facebook-ad landing pages. */
export default async function LandingLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  return (
    <ShopProviders settings={settings} categories={categories}>
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-3 py-2">
          <Link href="/" aria-label="MRM Zone Shop হোম"><Logo size={34} /></Link>
          <a href={`tel:${settings.phone}`} className="font-display inline-flex items-center gap-2 rounded-xl bg-navy px-3 py-2 text-sm font-semibold text-white">
            <Phone className="h-4 w-4" aria-hidden="true" /> {settings.phone}
          </a>
        </div>
      </header>
      <main id="main">{children}</main>
      <MiniCart />
      <footer className="mt-10 bg-navy py-6 text-center text-xs text-white/70">
        <p>© {new Date().getFullYear()} MRM Zone · <Link href="/" className="underline">mrmzone.shop</Link> · <Link href="/page/return-policy" className="underline">রিটার্ন পলিসি</Link></p>
      </footer>
    </ShopProviders>
  );
}
