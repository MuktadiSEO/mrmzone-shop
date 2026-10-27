"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import type { Paginated, Review } from "@/lib/types";
import { errorMessage, shopApi } from "@/lib/api";
import { cn, formatDate, money, toBanglaDigits } from "@/lib/format";
import { useSettings } from "@/lib/settings-context";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/misc";

function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <span className="flex" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((s) => <Star key={s} aria-hidden="true" className={cn(size, s <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-line")} />)}
    </span>
  );
}

function ReviewForm({ slug }: { slug: string }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await shopApi.addReview(slug, { name, rating, comment });
      setMsg({ tone: "success", text: "ধন্যবাদ! আপনার রিভিউ যাচাইয়ের পর প্রকাশ করা হবে।" });
      setName(""); setComment("");
    } catch (err) {
      setMsg({ tone: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-line bg-surface p-4">
      <h3 className="font-semibold">রিভিউ লিখুন</h3>
      <fieldset>
        <legend className="mb-1 text-sm font-medium text-navy">রেটিং</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} type="button" onClick={() => setRating(s)} aria-label={`${s} স্টার`} aria-pressed={rating === s}>
              <Star className={cn("h-7 w-7", s <= rating ? "fill-amber-400 text-amber-400" : "text-line")} />
            </button>
          ))}
        </div>
      </fieldset>
      <Input label="আপনার নাম" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} />
      <Textarea label="মন্তব্য" value={comment} onChange={(e) => setComment(e.target.value)} required maxLength={1000} />
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
      <Button type="submit" variant="accent" loading={busy}>রিভিউ জমা দিন</Button>
    </form>
  );
}

export function ProductTabs({ slug, description, reviews, rating, reviewsCount }: { slug: string; description: string | null; reviews: Paginated<Review>; rating: number; reviewsCount: number }) {
  const [tab, setTab] = useState<"desc" | "reviews" | "delivery">("desc");
  const settings = useSettings();
  const tabs = [
    { id: "desc", label: "বিবরণ" },
    { id: "reviews", label: `রিভিউ (${toBanglaDigits(reviewsCount)})` },
    { id: "delivery", label: "ডেলিভারি ও রিটার্ন" },
  ] as const;
  return (
    <section id="reviews" className="mt-8 scroll-mt-40 rounded-2xl border border-line bg-white">
      <div role="tablist" aria-label="পণ্যের তথ্য" className="scrollbar-none flex overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn("relative px-4 py-3 text-sm font-semibold whitespace-nowrap sm:px-6", tab === t.id ? "text-teal-dark" : "text-muted hover:text-navy")}
          >
            {t.label}
            {tab === t.id && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded bg-teal" aria-hidden="true" />}
          </button>
        ))}
      </div>
      <div className="p-4 sm:p-6" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "desc" && (description ? <div className="prose-shop max-w-3xl" dangerouslySetInnerHTML={{ __html: description }} /> : <p className="text-muted">বিবরণ শীঘ্রই যোগ করা হবে।</p>)}
        {tab === "reviews" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div>
              {reviewsCount > 0 && (
                <div className="mb-4 flex items-center gap-3">
                  <span className="font-display text-4xl font-bold text-navy">{rating.toFixed(1)}</span>
                  <div><Stars value={rating} size="h-5 w-5" /><p className="text-sm text-muted">{toBanglaDigits(reviewsCount)}টি রিভিউ</p></div>
                </div>
              )}
              {reviews.data.length === 0 ? (
                <p className="text-muted">এখনো কোনো রিভিউ নেই। প্রথম রিভিউটি আপনিই দিন!</p>
              ) : (
                <ul className="divide-y divide-line">
                  {reviews.data.map((r) => (
                    <li key={r.id} className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-teal-50 text-sm font-bold text-teal-dark">{r.name.slice(0, 1)}</span>
                          <span className="font-medium text-navy">{r.name}</span>
                        </span>
                        <span className="text-xs text-muted">{formatDate(r.created_at)}</span>
                      </div>
                      <div className="mt-1 pl-10"><Stars value={r.rating} /><p className="mt-1 text-sm">{r.comment}</p></div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <ReviewForm slug={slug} />
          </div>
        )}
        {tab === "delivery" && (
          <ul className="prose-shop max-w-3xl">
            <li>ঢাকার ভিতরে ১-২ দিন, ঢাকার বাইরে ২-৪ কর্মদিবসের মধ্যে ডেলিভারি।</li>
            <li>ডেলিভারি চার্জ: ঢাকার ভিতরে {money(settings.delivery.inside_dhaka)}, ঢাকার বাইরে {money(settings.delivery.outside_dhaka)}।</li>
            {settings.delivery.free_delivery_min_qty > 0 && <li>{toBanglaDigits(settings.delivery.free_delivery_min_qty)}টি বা তার বেশি পণ্য অর্ডারে ডেলিভারি চার্জ ফ্রি।</li>}
            <li>সারা বাংলাদেশে ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে চেক করে মূল্য পরিশোধ করুন।</li>
            <li>ত্রুটিপূর্ণ বা ভুল পণ্য পেলে ডেলিভারিম্যানের সামনেই রিটার্ন করতে পারবেন। <Link href="/page/return-policy">রিটার্ন পলিসি</Link></li>
          </ul>
        )}
      </div>
    </section>
  );
}
