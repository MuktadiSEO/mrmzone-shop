"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { adminApi, errorMessage } from "@/lib/api";
import { useAdminQuery } from "@/lib/use-admin-query";
import { BD_PHONE_RE, formatDate, normalizePhone } from "@/lib/format";
import type { Paginated, SmsLog } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyRow, Table, Td, Th } from "@/components/ui/Table";
import { Spinner } from "@/components/ui/misc";
import { PageHeader } from "@/components/admin/common";
import { useToast } from "@/components/admin/Toast";

export default function SmsPage() {
  const toast = useToast();
  const logs = useAdminQuery<Paginated<SmsLog>>("/sms/logs");
  const [phones, setPhones] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const list = phones.split(/[\s,;]+/).map((p) => normalizePhone(p)).filter(Boolean);
  const valid = list.filter((p) => BD_PHONE_RE.test(p));
  const isUnicode = /[^\x00-\x7F]/.test(message);
  const parts = message ? Math.ceil(message.length / (isUnicode ? 67 : 153)) : 0;

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid.length || !message.trim()) return toast("Add phone numbers and a message", "error");
    setBusy(true);
    try {
      await adminApi.post("/sms/send", { phones: Array.from(new Set(valid)), message });
      toast(`SMS sent to ${valid.length} numbers`);
      setMessage("");
      logs.reload();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="SMS" subtitle="Bulk SMS and logs. Auto SMS templates live in Settings." />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card className="h-fit">
          <CardHeader title="Send bulk SMS" />
          <form onSubmit={send} className="space-y-3 p-4">
            <Textarea label="Phone numbers" value={phones} onChange={(e) => setPhones(e.target.value)} rows={4} placeholder="One per line or comma separated" hint={`${valid.length} valid / ${list.length} entered`} className="font-display" />
            <Textarea label="Message" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} hint={`${message.length} chars · ${parts} SMS part(s)${isUnicode ? " · Bangla (unicode)" : ""}`} />
            <Button type="submit" variant="accent" className="w-full" loading={busy} icon={<Send className="h-4 w-4" />}>Send SMS</Button>
          </form>
        </Card>
        <Card>
          <CardHeader title="SMS logs" />
          <Table>
            <thead><tr><Th>Phone</Th><Th>Message</Th><Th>Status</Th><Th>Time</Th></tr></thead>
            <tbody>
              {logs.loading && !logs.data ? <EmptyRow colSpan={4}><Spinner /></EmptyRow> : !logs.data?.data.length ? <EmptyRow colSpan={4}>No SMS sent yet</EmptyRow> : logs.data.data.map((l) => (
                <tr key={l.id}>
                  <Td className="font-display">{l.phone}</Td>
                  <Td className="max-w-md text-xs">{l.message}</Td>
                  <Td><Badge tone={l.status === "sent" || l.status === "delivered" ? "green" : l.status === "failed" ? "red" : "amber"}>{l.status}</Badge></Td>
                  <Td className="text-xs text-muted">{formatDate(l.created_at, true)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </>
  );
}
