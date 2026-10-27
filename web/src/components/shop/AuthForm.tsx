"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, authApi, errorMessage } from "@/lib/api";
import { useCustomer } from "@/lib/customer-auth";
import { isValidBdPhone, normalizePhone } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/misc";
import { LogoMark } from "@/components/Logo";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";
  const { setSession } = useCustomer();
  const [name, setName] = useState("");
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setFieldErr({});
    if (mode === "register" && !isValidBdPhone(login)) return setFieldErr({ phone: "সঠিক মোবাইল নম্বর দিন" });
    if (password.length < 6 && mode === "register") return setFieldErr({ password: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" });
    setBusy(true);
    try {
      const id = login.includes("@") ? login.trim() : normalizePhone(login);
      const r = mode === "login"
        ? await authApi.login(id, password)
        : await authApi.register({ name: name.trim(), phone: normalizePhone(login), email: email.trim() || undefined, password });
      setSession(r.token, r.user);
      router.push(next.startsWith("/") ? next : "/account");
    } catch (e2) {
      if (e2 instanceof ApiError) {
        const fe: Record<string, string> = {};
        Object.entries(e2.errors || {}).forEach(([k, v]) => (fe[k] = v[0]));
        setFieldErr(fe);
      }
      setErr(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-3 py-8">
      <div className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
        <div className="mb-5 text-center">
          <LogoMark size={48} className="mx-auto" />
          <h1 className="mt-2 text-xl font-bold">{mode === "login" ? "আপনার অ্যাকাউন্টে লগইন করুন" : "নতুন অ্যাকাউন্ট খুলুন"}</h1>
          <p className="mt-1 text-sm text-muted">অর্ডার ট্র্যাক ও দ্রুত চেকআউটের জন্য</p>
        </div>
        <form onSubmit={submit} className="space-y-3.5" noValidate>
          {mode === "register" && <Input label="নাম" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" error={fieldErr.name} />}
          <Input
            label={mode === "login" ? "মোবাইল নম্বর বা ইমেইল" : "মোবাইল নম্বর"}
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
            inputMode={mode === "register" ? "tel" : "email"}
            autoComplete={mode === "login" ? "username" : "tel"}
            placeholder={mode === "login" ? "01XXXXXXXXX" : "01XXXXXXXXX"}
            error={fieldErr.login || fieldErr.phone}
            className="font-display"
          />
          {mode === "register" && <Input label="ইমেইল (ঐচ্ছিক)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" error={fieldErr.email} />}
          <Input label="পাসওয়ার্ড" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === "login" ? "current-password" : "new-password"} error={fieldErr.password} />
          {err && <Alert>{err}</Alert>}
          <Button type="submit" variant="accent" size="lg" loading={busy} className="w-full">{mode === "login" ? "লগইন" : "রেজিস্টার"}</Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          {mode === "login" ? <>অ্যাকাউন্ট নেই? <Link href="/register" className="font-semibold text-teal-dark hover:underline">রেজিস্টার করুন</Link></> : <>আগে থেকেই অ্যাকাউন্ট আছে? <Link href="/login" className="font-semibold text-teal-dark hover:underline">লগইন করুন</Link></>}
        </p>
        <p className="mt-2 text-center text-xs text-muted">অ্যাকাউন্ট ছাড়াও অর্ডার করা যায় — শুধু চেকআউটে নাম, ফোন ও ঠিকানা দিন।</p>
      </div>
    </div>
  );
}
