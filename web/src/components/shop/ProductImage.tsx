import { cn } from "@/lib/format";
import { CategoryIcon } from "./CategoryIcon";

const palettes = [
  ["#E6F4F4", "#CBEDEE", "#078080"],
  ["#EEF0FF", "#DCE0FF", "#6366F1"],
  ["#E9F7FB", "#CFF3FA", "#0E7490"],
  ["#F1F4F8", "#DCE3EC", "#0B1F3A"],
  ["#FFF4EA", "#FDE3C8", "#B45309"],
  ["#F3EEFB", "#E3D8F7", "#7C3AED"],
];

const catIcon: Record<string, string> = {
  fashion: "shirt", lifestyle: "bag", accessories: "watch", gadget: "headphones", "home-living": "home", seasonal: "snowflake",
};

interface Props {
  src?: string | null;
  alt: string;
  seed?: number;
  icon?: string | null;
  categorySlug?: string | null;
  className?: string;
  rounded?: string;
  label?: boolean;
  eager?: boolean;
}

/** Product/banner image with a branded placeholder when no image is available. */
export function ProductImage({ src, alt, seed = 0, icon, categorySlug, className, rounded = "rounded-xl", label, eager }: Props) {
  if (src) {
    return (
      <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" className={cn("h-full w-full object-cover", rounded, className)} />
    );
  }
  const [a, b, fg] = palettes[Math.abs(seed) % palettes.length];
  const ic = icon ?? (categorySlug ? catIcon[categorySlug] : null) ?? "tag";
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn("relative flex h-full w-full items-center justify-center overflow-hidden", rounded, className)}
      style={{ background: `radial-gradient(120% 90% at 20% 10%, ${a} 0%, ${b} 70%)` }}
    >
      <svg className="absolute -right-6 -bottom-6 h-1/2 w-1/2 opacity-[0.12]" viewBox="0 0 512 512" aria-hidden="true">
        <path d="M256 56 L429.2 156 V356 L256 456 L82.8 356 V156 Z" fill="none" stroke={fg} strokeWidth="30" strokeLinejoin="round" />
      </svg>
      <span className="flex flex-col items-center gap-1.5" style={{ color: fg }}>
        <CategoryIcon name={ic} className="h-1/3 max-h-16 w-1/3 max-w-16 min-h-7 min-w-7" strokeWidth={1.5} />
        {label && <span className="px-3 text-center text-xs font-medium opacity-80 line-clamp-1">{alt}</span>}
      </span>
    </div>
  );
}
