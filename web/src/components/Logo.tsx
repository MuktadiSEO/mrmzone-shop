import { cn } from "@/lib/format";

interface LogoProps {
  variant?: "dark" | "light"; // dark = navy on light bg, light = white on dark bg
  showWordmark?: boolean;
  className?: string;
  size?: number;
}

export function LogoMark({ size = 40, color = "#0B1F3A", accent = "#078080", className }: { size?: number; color?: string; accent?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" aria-hidden="true" className={className}>
      <path d="M256 56 L429.2 156 V356 L256 456 L82.8 356 V156 Z" stroke={color} strokeWidth={22} strokeLinejoin="round" />
      <path d="M190 311 V201 L256 251 L322 201 V311" stroke={accent} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ variant = "dark", showWordmark = true, className, size = 40 }: LogoProps) {
  const fg = variant === "dark" ? "#0B1F3A" : "#FFFFFF";
  const accent = variant === "dark" ? "#078080" : "#22D3EE";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} color={fg} accent={accent} />
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.15rem] font-bold tracking-[0.14em]" style={{ color: fg }}>
            MRM ZONE
          </span>
          <span className="font-display mt-0.5 text-[0.62rem] font-semibold tracking-[0.5em]" style={{ color: accent }}>
            SHOP
          </span>
        </span>
      )}
      <span className="sr-only">MRM Zone Shop</span>
    </span>
  );
}
