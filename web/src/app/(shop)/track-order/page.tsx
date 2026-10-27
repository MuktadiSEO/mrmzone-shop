import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackForm } from "./TrackForm";
import { Container } from "@/components/shop/Section";

export const metadata: Metadata = { title: "অর্ডার ট্র্যাক করুন", description: "অর্ডার নম্বর ও মোবাইল নম্বর দিয়ে আপনার অর্ডারের অবস্থা জানুন।" };

export default function TrackOrderPage() {
  return (
    <Container className="py-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-xl font-bold sm:text-2xl">অর্ডার ট্র্যাক করুন</h1>
        <p className="mt-1 mb-4 text-sm text-muted">অর্ডার নম্বর ও যে মোবাইল নম্বর দিয়ে অর্ডার করেছেন তা দিন।</p>
        <Suspense>
          <TrackForm />
        </Suspense>
      </div>
    </Container>
  );
}
