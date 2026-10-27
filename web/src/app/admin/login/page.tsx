"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { useAdmin } from "@/lib/admin-auth";
import { DEMO_MODE, errorMessage } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/misc";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdmin();
  const [id, setId] = useState(DEMO_MODE ? "admin@mrmzone.shop" : "");
  const [password, setPassword] = useState(DEMO_MODE ? "demo" : "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await login(id.trim(), password);
      let next = "/admin";
      try {
        const n = new URLSearchParams(window.location.search).get("next");
        if (n && n.startsWith("/admin") && n !== "/admin/login") next = n;
      } catch { /* ignore */ }
      router.replace(next);
    } catch (e2) {
      setErr(errorMessage(e2));
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Logo variant="light" size={48} />
        <div>
          <h2 className="text-3xl font-bold text-white">প্রয়োজনের সবকিছু, এক জায়গায়</h2>
          <p className="mt-2 text-white/70">Orders, inventory, couriers and reports — all in one place.</p>
        </div>
        <svg className="absolute -right-24 -bottom-24 h-[420px] w-[420px] opacity-10" viewBox="0 0 512 512" aria-hidden="true">
          <path d="M256 56 L429.2 156 V356 L256 456 L82.8 356 V156 Z" fill="none" stroke="#22D3EE" strokeWidth="22" strokeLinejoin="round" />
        </svg>
        <p className="text-xs text-white/40">© MRM Zone</p>
      </div>
      <div className="flex items-center justify-center bg-surface p-4">
        <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-line bg-white p-7 shadow-card">
          <div className="mb-6 lg:hidden"><Logo size={40} /></div>
          <h1 className="text-xl font-bold">Admin login</h1>
          <p className="mb-5 text-sm text-muted">Sign in with your staff account.</p>
          <div className="space-y-3.5">
            <Input label="Email or phone" value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            {err && <Alert>{err}</Alert>}
            <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy} icon={<Lock className="h-4 w-4" />}>Login</Button>
          </div>
          {DEMO_MODE && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Demo mode: <b>admin@mrmzone.shop</b> / <b>demo</b></p>}
        </form>
      </div>
    </div>
  );
}
