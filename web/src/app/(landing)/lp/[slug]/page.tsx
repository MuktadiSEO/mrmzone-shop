import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiError, shopApi, SITE_URL } from "@/lib/api";
import type { LandingPage } from "@/lib/types";
import { LandingView } from "./LandingView";
import { EmptyState } from "@/components/ui/misc";

export const revalidate = 60;

async function load(slug: string): Promise<LandingPage | null | "error"> {
  try {
    return (await shopApi.landing(slug)).data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    return "error";
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const lp = await load(slug);
  if (!lp || lp === "error") return { title: "অফার" };
  const image = lp.hero_image || lp.product?.image;
  return {
    title: lp.title || lp.headline,
    description: lp.subheadline || lp.product?.short_description || undefined,
    alternates: { canonical: `/lp/${lp.slug}` },
    openGraph: { title: lp.headline, description: lp.subheadline || undefined, url: `${SITE_URL}/lp/${lp.slug}`, images: image ? [image] : undefined },
  };
}

export default async function LandingRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lp = await load(slug);
  if (lp === null) notFound();
  if (lp === "error" || !lp.product) {
    return <div className="mx-auto max-w-lg px-4 py-16"><EmptyState title="অফার পেজ লোড করা যাচ্ছে না" text="কিছুক্ষণ পর আবার চেষ্টা করুন অথবা আমাদের কল করুন।" /></div>;
  }
  return <LandingView lp={lp} />;
}
