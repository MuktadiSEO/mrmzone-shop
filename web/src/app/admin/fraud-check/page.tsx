"use client";

import { useState, type FormEvent } from "react";
import { ShieldAlert } from "lucide-react";
import { adminApi, errorMessage } from "@/lib/api";
import { isValidBdPhone, normalizePhone } from "@/lib/format";
import type { FraudCheck } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/misc";
import { FraudResult, PageHeader } from "@/components/admin/common";

export default function FraudCheckPage() {
  const [phone, setPhone] = useState("");
  const [data, setData] = useState<FraudCheck | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!isValidBdPhone(phone)) return setErr("Enter a valid Bangladeshi mobile number");
    setBusy(true);
    try {
      const r = await adminApi.get<{ data: FraudCheck }>("/fraud-check", { phone: normalizePhone(phone) });
      setData(r.data);
    } catch (e2) {
      setErr(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeader title="Fraud check" subtitle="Courier-wise delivery success rate for a phone number" />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit p-4">
          <form onSubmit={run} className="space-y-3">
            <Input label="Customer phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" inputMode="tel" className="font-display" />
            {err && <Alert>{err}</Alert>}
            <Button type="submit" variant="primary" className="w-full" loading={busy} icon={<ShieldAlert className="h-4 w-4" />}>Check</Button>
          </form>
        </Card>
        <Card className="p-5">{data ? <FraudResult data={data} /> : <p className="py-10 text-center text-sm text-muted">Enter a phone number to see its courier history.</p>}</Card>
      </div>
    </>
  );
}
