"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { track } from "@/lib/pixel";

/** Loads the Meta Pixel only when an id is configured in /settings. Fires PageView on route changes. */
export function MetaPixel({ pixelId }: { pixelId: string | null | undefined }) {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (!pixelId) return;
    if (first.current) {
      first.current = false; // initial PageView is sent by the bootstrap snippet
      return;
    }
    track("PageView");
  }, [pathname, pixelId]);

  if (!pixelId || !/^\d{5,20}$/.test(pixelId)) return null;
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
    </Script>
  );
}

/** Fire a pixel event once when mounted (for server-rendered pages like product detail). */
export function PixelEvent({ event, params }: { event: "ViewContent" | "InitiateCheckout" | "Purchase" | "Search"; params?: Record<string, unknown> }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    // small delay so the pixel bootstrap (afterInteractive) has a chance to define fbq
    const t = setTimeout(() => track(event, params), 400);
    return () => clearTimeout(t);
  }, [event, params]);
  return null;
}
