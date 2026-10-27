import { ShopProviders } from "@/components/shop/Providers";
import { Header } from "@/components/shop/Header";
import { FloatingWhatsApp, Footer } from "@/components/shop/Footer";
import { getCategories, getSettings } from "@/lib/server-data";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  return (
    <ShopProviders settings={settings} categories={categories}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">মূল কনটেন্টে যান</a>
      <Header />
      <main id="main" className="min-h-[60vh]">{children}</main>
      <Footer settings={settings} />
      <FloatingWhatsApp whatsapp={settings.whatsapp} />
    </ShopProviders>
  );
}
