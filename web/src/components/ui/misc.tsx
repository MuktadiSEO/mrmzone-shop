import type { ReactNode } from "react";
import { Loader2, PackageOpen } from "lucide-react";
import { cn } from "@/lib/format";

export function Spinner({ className, label = "লোড হচ্ছে…" }: { className?: string; label?: string }) {
  return (
    <span role="status" className={cn("inline-flex items-center gap-2 text-muted", className)}>
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </span>
  );
}

export function EmptyState({ title, text, action, icon }: { title: string; text?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-teal-50 text-teal-dark">{icon ?? <PackageOpen className="h-7 w-7" />}</div>
      <h3 className="text-base font-semibold text-navy">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Alert({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: ReactNode }) {
  const c = tone === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-sky-200 bg-sky-50 text-sky-800";
  return <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-xl border px-3.5 py-2.5 text-sm", c)}>{children}</div>;
}
