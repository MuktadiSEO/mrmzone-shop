// Meta Pixel helpers. fbq is injected by <MetaPixel/> only when settings.meta_pixel_id is set.
type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

export type PixelEvent = "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase" | "Search" | "Lead";

export function track(event: PixelEvent, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    if (params) window.fbq("track", event, { currency: "BDT", ...params });
    else window.fbq("track", event);
  } catch {
    /* never break the shop because of tracking */
  }
}
