import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/format";

export function Card({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-line bg-white shadow-card", className)} {...rest} />;
}

export function CardHeader({ title, action, className, subtitle }: { title: ReactNode; action?: ReactNode; className?: string; subtitle?: ReactNode }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5", className)}>
      <div>
        <h2 className="text-[1rem] font-semibold text-navy">{title}</h2>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
