import type { Metadata } from "next";
import { CheckoutView } from "./CheckoutView";

export const metadata: Metadata = { title: "চেকআউট", robots: { index: false } };

export default function CheckoutPage() {
  return <CheckoutView />;
}
