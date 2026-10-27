"use client";

import { useEffect, type ReactNode } from "react";
import { writeSession } from "@/lib/storage";
import type { Category, StoreSettings } from "@/lib/types";
import { SettingsProvider } from "@/lib/settings-context";
import { CartProvider } from "@/lib/cart";
import { CustomerAuthProvider } from "@/lib/customer-auth";
import { WishlistProvider } from "@/lib/wishlist";
import { MetaPixel } from "./MetaPixel";

/** Remember utm_* from the ad click for the order payload (POST /orders utm_source/utm_campaign). */
function UtmCapture() {
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const src = p.get("utm_source") || (p.get("fbclid") ? "facebook" : null);
      if (src) writeSession("mrm_utm", { utm_source: src, utm_campaign: p.get("utm_campaign") || undefined });
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}

export function ShopProviders({ settings, categories, children }: { settings: StoreSettings; categories: Category[]; children: ReactNode }) {
  return (
    <SettingsProvider settings={settings} categories={categories}>
      <CustomerAuthProvider>
        <WishlistProvider>
          <CartProvider>
            {children}
            <MetaPixel pixelId={settings.meta_pixel_id} />
            <UtmCapture />
          </CartProvider>
        </WishlistProvider>
      </CustomerAuthProvider>
    </SettingsProvider>
  );
}
