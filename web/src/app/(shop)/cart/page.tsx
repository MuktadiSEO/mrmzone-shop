import type { Metadata } from "next";
import { CartView } from "./CartView";

export const metadata: Metadata = { title: "শপিং কার্ট", robots: { index: false } };

export default function CartPage() {
  return <CartView />;
}
