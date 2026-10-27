import type { Metadata } from "next";
import { WishlistView } from "./WishlistView";

export const metadata: Metadata = { title: "উইশলিস্ট", robots: { index: false } };

export default function WishlistPage() {
  return <WishlistView />;
}
