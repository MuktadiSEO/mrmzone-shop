"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { LogOut, Package, UserRound } from "lucide-react";
import { authApi, errorMessage } from "@/lib/api";
import { useCustomer } from "@/lib/customer-auth";
import { cn, formatDate, money, STATUS_TONE } from "@/lib/format";
import type { Order } from "@/lib/types";
import { Container } from "@/components/shop/Section";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Alert, EmptyState, Spinner } from "@/components/ui/misc";
import { OrderTracker } from "@/components/shop/OrderTimeline";

export function AccountView() {
  const router = useRouter();
  const { user, ready, logout, setSession, token } = useCustomer();
  const [tab, setTab] = useState<"orders" | "profile">("orders");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/account");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setEmail(user.email ?? "");
    setAddress(user.addresses?.[0]?.address ?? "");
    authApi.myOrders().then((r) => setOrders(r.data)).catch(() => setOrders([]));
  }, [user]);

  if (!ready || !user) return <Container className="py-16 text-center"><Spinner /></Container>;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await authApi.updateMe({ name, email: email || null, addresses: address ? [{ address }] : [] });
      if (token) setSession(token, r.data);
      setMsg({ tone: "success", text: "প্রোফাইল আপডেট হয়েছে" });
    } catch (err) {
      setMsg({ tone: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">আমার অ্যাকাউন্ট</h1>
          <p className="text-sm text-muted">{user.name} · <span className="font-display">{user.phone}</span></p>
        </div>
        <Button variant="outline" size="sm" icon={<LogOut className="h-4 w-4" />} onClick={() => { logout(); router.push("/"); }}>লগআউট</Button>
      </div>
      <div className="mb-4 flex gap-2" role="tablist">
        {([["orders", "আমার অর্ডার", Package], ["profile", "প্রোফাইল", UserRound]] as const).map(([id, label, Icon]) => (
          <button key={id} role="tab" aria-selected={tab === id} type="button" onClick={() => setTab(id)} className={cn("inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold", tab === id ? "bg-navy text-white" : "border border-line bg-white text-navy")}>
            <Icon className="h-4 w-4" aria-hidden="true" /> {label}
          </button>
        ))}
      </div>
      {tab === "orders" ? (
        orders === null ? <Spinner /> : orders.length === 0 ? (
          <EmptyState title="এখনো কোনো অর্ডার নেই" action={<ButtonLink href="/products" variant="accent">শপিং শুরু করুন</ButtonLink>} />
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li key={o.id}>
                {open === o.id ? (
                  <div>
                    <OrderTracker order={o} />
                    <button type="button" className="mt-2 text-sm text-teal-dark hover:underline" onClick={() => setOpen(null)}>বন্ধ করুন</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setOpen(o.id)} className="flex w-full flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-white p-4 text-left hover:border-teal">
                    <span>
                      <span className="font-display block font-semibold text-navy">{o.number}</span>
                      <span className="text-xs text-muted">{formatDate(o.created_at, true)} · {o.items.length}টি পণ্য</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <Badge tone={STATUS_TONE[o.status] ?? "gray"}>{o.status_label}</Badge>
                      <span className="font-display font-bold text-navy">{money(o.total)}</span>
                    </span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )
      ) : (
        <form onSubmit={save} className="max-w-lg space-y-3 rounded-2xl border border-line bg-white p-5">
          <Input label="নাম" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="মোবাইল" value={user.phone ?? ""} disabled className="font-display" />
          <Input label="ইমেইল" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="ডিফল্ট ঠিকানা" value={address} onChange={(e) => setAddress(e.target.value)} />
          {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
          <Button type="submit" variant="accent" loading={busy}>সংরক্ষণ করুন</Button>
        </form>
      )}
    </Container>
  );
}
