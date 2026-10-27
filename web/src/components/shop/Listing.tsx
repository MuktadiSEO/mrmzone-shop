"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toEnglishDigits } from "@/lib/format";

const sorts = [
  { value: "latest", label: "নতুন আগে" },
  { value: "popular", label: "জনপ্রিয়" },
  { value: "price_asc", label: "দাম: কম থেকে বেশি" },
  { value: "price_desc", label: "দাম: বেশি থেকে কম" },
];

export function ListingFilters({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [min, setMin] = useState(params.get("min_price") ?? "");
  const [max, setMax] = useState(params.get("max_price") ?? "");
  const [open, setOpen] = useState(false);

  const push = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    p.delete("page");
    router.push(`${pathname}${p.toString() ? `?${p}` : ""}`, { scroll: false });
  };

  const applyPrice = (e: FormEvent) => {
    e.preventDefault();
    push({ min_price: toEnglishDigits(min).replace(/\D/g, "") || null, max_price: toEnglishDigits(max).replace(/\D/g, "") || null });
    setOpen(false);
  };

  return (
    <div className="mb-4 rounded-2xl border border-line bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm text-muted">
          মোট <span className="font-display font-semibold text-navy">{total}</span> টি পণ্য
        </p>
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)} aria-expanded={open} icon={<SlidersHorizontal className="h-4 w-4" />}>
          দামের ফিল্টার
        </Button>
        <label className="sr-only" htmlFor="sort">সাজান</label>
        <select
          id="sort"
          value={params.get("sort") ?? "latest"}
          onChange={(e) => push({ sort: e.target.value === "latest" ? null : e.target.value })}
          className="h-8 rounded-lg border border-line bg-white px-2 text-sm text-navy focus:border-teal focus:outline-none"
        >
          {sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      {open && (
        <form onSubmit={applyPrice} className="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-3">
          <label className="flex flex-col text-xs text-muted">সর্বনিম্ন (৳)
            <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} className="font-display mt-1 h-9 w-28 rounded-lg border border-line px-2 text-sm text-navy focus:border-teal focus:outline-none" placeholder="0" />
          </label>
          <label className="flex flex-col text-xs text-muted">সর্বোচ্চ (৳)
            <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} className="font-display mt-1 h-9 w-28 rounded-lg border border-line px-2 text-sm text-navy focus:border-teal focus:outline-none" placeholder="5000" />
          </label>
          <Button type="submit" size="sm" variant="accent">প্রয়োগ করুন</Button>
          {(params.get("min_price") || params.get("max_price")) && (
            <Button size="sm" variant="ghost" onClick={() => { setMin(""); setMax(""); push({ min_price: null, max_price: null }); }}>মুছুন</Button>
          )}
          <div className="flex w-full flex-wrap gap-1.5 pt-1">
            {[[0, 500], [500, 1000], [1000, 2000], [2000, 0]].map(([a, b]) => (
              <button key={`${a}-${b}`} type="button" className="rounded-full border border-line px-3 py-1 text-xs text-navy hover:border-teal" onClick={() => { setMin(a ? String(a) : ""); setMax(b ? String(b) : ""); push({ min_price: a ? String(a) : null, max_price: b ? String(b) : null }); setOpen(false); }}>
                {b ? `৳${a} – ৳${b}` : `৳${a}+`}
              </button>
            ))}
          </div>
        </form>
      )}
    </div>
  );
}
