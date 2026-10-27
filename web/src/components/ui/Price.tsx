import { cn, money } from "@/lib/format";

export function Price({ price, sale, size = "md", className }: { price: number; sale?: number | null; size?: "sm" | "md" | "lg"; className?: string }) {
  const hasSale = sale !== null && sale !== undefined && sale < price;
  const main = hasSale ? sale! : price;
  const big = size === "lg" ? "text-3xl" : size === "md" ? "text-lg" : "text-base";
  const small = size === "lg" ? "text-lg" : "text-sm";
  return (
    <span className={cn("font-display inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-bold text-teal-dark", big)}>{money(main)}</span>
      {hasSale && (
        <del className={cn("text-slate-400", small)}>
          <span className="sr-only">আগের দাম </span>
          {money(price)}
        </del>
      )}
    </span>
  );
}
