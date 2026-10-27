import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiError, shopApi } from "@/lib/api";
import type { CmsPage } from "@/lib/types";
import { Breadcrumbs, Container } from "@/components/shop/Section";
import { EmptyState } from "@/components/ui/misc";

export const revalidate = 600;

const fallbackTitles: Record<string, string> = {
  about: "আমাদের সম্পর্কে", terms: "শর্তাবলী", privacy: "প্রাইভেসি পলিসি", "return-policy": "রিটার্ন পলিসি", "delivery-policy": "ডেলিভারি পলিসি",
};

async function load(slug: string): Promise<CmsPage | null | "error"> {
  try {
    return await shopApi.page(slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    return "error";
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await load(slug);
  const title = p && p !== "error" ? p.title : fallbackTitles[slug] ?? "পেজ";
  return { title, alternates: { canonical: `/page/${slug}` } };
}

export default async function CmsPageView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await load(slug);
  if (page === null) notFound();
  const title = page === "error" ? fallbackTitles[slug] ?? "পেজ" : page.title;
  return (
    <Container>
      <Breadcrumbs items={[{ label: title }]} />
      <article className="mx-auto max-w-3xl rounded-2xl border border-line bg-white p-5 sm:p-8">
        <h1 className="mb-4 text-2xl font-bold">{title}</h1>
        {page === "error" ? (
          <EmptyState title="কনটেন্ট লোড করা যাচ্ছে না" text="কিছুক্ষণ পর আবার চেষ্টা করুন।" />
        ) : (
          <div className="prose-shop" dangerouslySetInnerHTML={{ __html: page.content }} />
        )}
      </article>
    </Container>
  );
}
