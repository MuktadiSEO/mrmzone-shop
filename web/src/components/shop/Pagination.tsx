import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/format";

export function Pagination({ page, last, basePath, params }: { page: number; last: number; basePath: string; params: Record<string, string | undefined> }) {
  if (last <= 1) return null;
  const href = (p: number) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && k !== "page" && q.set(k, v));
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return `${basePath}${s ? `?${s}` : ""}`;
  };
  const pages = Array.from({ length: last }, (_, i) => i + 1).filter((p) => p === 1 || p === last || Math.abs(p - page) <= 1);
  return (
    <nav aria-label="পেজ নেভিগেশন" className="mt-8 flex justify-center">
      <ul className="flex items-center gap-1">
        <li>
          {page > 1 ? <Link href={href(page - 1)} className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-navy hover:border-teal" aria-label="আগের পেজ"><ChevronLeft className="h-4 w-4" /></Link> : null}
        </li>
        {pages.map((p, i) => (
          <li key={p} className="flex items-center gap-1">
            {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
            <Link href={href(p)} aria-current={p === page ? "page" : undefined} className={cn("font-display grid h-10 min-w-10 place-items-center rounded-xl border px-2 font-semibold", p === page ? "border-navy bg-navy text-white" : "border-line bg-white text-navy hover:border-teal")}>
              {p}
            </Link>
          </li>
        ))}
        <li>
          {page < last ? <Link href={href(page + 1)} className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-navy hover:border-teal" aria-label="পরের পেজ"><ChevronRight className="h-4 w-4" /></Link> : null}
        </li>
      </ul>
    </nav>
  );
}
