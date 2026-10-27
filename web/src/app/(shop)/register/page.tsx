import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/shop/AuthForm";

export const metadata: Metadata = { title: "রেজিস্টার", robots: { index: false } };

export default function RegisterPage() {
  return <Suspense><AuthForm mode="register" /></Suspense>;
}
