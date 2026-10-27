import type { Metadata } from "next";
import { AccountView } from "./AccountView";

export const metadata: Metadata = { title: "আমার অ্যাকাউন্ট", robots: { index: false } };

export default function AccountPage() {
  return <AccountView />;
}
