import type { Metadata, Viewport } from "next";
import "./globals.css";
import { hind, outfit } from "./fonts";
import { SITE_URL } from "@/lib/api";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "MRM Zone Shop — প্রয়োজনের সবকিছু, এক জায়গায়", template: "%s | MRM Zone Shop" },
  description: "মানসম্মত পণ্য · সাশ্রয়ী দাম · দ্রুত ডেলিভারি। সারা বাংলাদেশে ক্যাশ অন ডেলিভারি। ফ্যাশন, গ্যাজেট, অ্যাক্সেসরিজ, হোম ও লিভিং।",
  applicationName: "MRM Zone Shop",
  openGraph: { type: "website", siteName: "MRM Zone Shop", locale: "bn_BD" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0B1F3A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${hind.variable} ${outfit.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
