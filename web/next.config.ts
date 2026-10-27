import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    // Product images come from the Laravel API / CDN; we render with <img> to stay host-agnostic.
    unoptimized: true,
  },
};

export default nextConfig;
