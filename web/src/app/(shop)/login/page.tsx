import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/shop/AuthForm";

export const metadata: Metadata = { title: "লগইন", robots: { index: false } };

export default function LoginPage() {
  return <Suspense><AuthForm mode="login" /></Suspense>;
}
