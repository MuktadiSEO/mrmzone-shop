import type { Metadata } from "next";
import { OrderSuccess } from "./OrderSuccess";

export const metadata: Metadata = { title: "অর্ডার সম্পন্ন হয়েছে", robots: { index: false } };

export default async function SuccessPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  return <OrderSuccess number={decodeURIComponent(number)} />;
}
