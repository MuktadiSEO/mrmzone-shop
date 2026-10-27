"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { errorMessage, shopApi } from "@/lib/api";
import { isValidBdPhone, normalizePhone } from "@/lib/format";
import type { Order } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/misc";
import { OrderTracker } from "@/components/shop/OrderTimeline";

export function TrackForm() {
  const params = useSearchParams();
  const [number, setNumber] = useState(params.get("number") ?? "");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOrder(null);
    if (!number.trim()) return setErr("অর্ডার নম্বর দিন");
    if (!isValidBdPhone(phone)) return setErr("সঠিক মোবাইল নম্বর দিন");
    setBusy(true);
    try {
      const r = await shopApi.track(number.trim().toUpperCase(), normalizePhone(phone));
      setOrder(r.data);
    } catch (e2) {
      setErr(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Input label="অর্ডার নম্বর" placeholder="MRM-XXXXXX-XXXX" value={number} onChange={(e) => setNumber(e.target.value)} className="font-display uppercase" required />
        <Input label="মোবাইল নম্বর" type="tel" inputMode="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className="font-display" required />
        <Button type="submit" variant="accent" size="lg" loading={busy} icon={<Search className="h-5 w-5" />} className="h-11">ট্র্যাক করুন</Button>
      </form>
      {err && <Alert>{err}</Alert>}
      {order && <OrderTracker order={order} />}
    </div>
  );
}
