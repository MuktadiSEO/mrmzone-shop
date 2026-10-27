import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export function SectionTitle({ title, href, sub }: { title: ReactNode; href?: string; sub?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
      <div>
        <h2 className="relative pl-3 text-lg font-bold text-navy sm:text-xl">
          <span className="brand-gradient absolute top-1 bottom-1 left-0 w-1 rounded-full" aria-hidden="true" />
          {title}
        </h2>
        {sub && <p className="mt-0.5 pl-3 text-xs text-muted sm:text-sm">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-teal-dark hover:underline">
          সব দেখুন <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-3 sm:px-4 ${className}`}>{children}</div>;
}

export function Breadcrumbs({ items }: { items: Array<{ href?: string; label: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="py-3 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        <li><Link href="/" className="hover:text-teal-dark">হোম</Link></li>
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            {it.href ? <Link href={it.href} className="hover:text-teal-dark">{it.label}</Link> : <span aria-current="page" className="line-clamp-1 text-navy">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
