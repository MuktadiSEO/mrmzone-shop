"use client";

import { useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, ShieldAlert, Upload, X } from "lucide-react";
import { adminApi, errorMessage } from "@/lib/api";
import { cn, normalizePhone, STATUS_LABELS, STATUS_TONE } from "@/lib/format";
import type { FraudCheck, OrderStatus } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/misc";
import { useToast } from "./Toast";

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold text-navy">{title}</h2>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status, label }: { status: OrderStatus | string; label?: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "gray"}>{label || STATUS_LABELS[status as OrderStatus] || status}</Badge>;
}

export function AdminPager({ page, last, total, onPage }: { page: number; last: number; total?: number; onPage: (p: number) => void }) {
  if (last <= 1) return total !== undefined ? <p className="px-4 py-3 text-xs text-muted">{total} records</p> : null;
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
      <span className="text-muted">Page {page} of {last}{total !== undefined ? ` · ${total} records` : ""}</span>
      <div className="flex gap-1">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
        <Button size="sm" variant="outline" disabled={page >= last} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

const riskTone = { low: "green", medium: "amber", high: "red" } as const;
const riskLabel = { low: "Low risk", medium: "Medium risk", high: "High risk" } as const;

export function RiskBadge({ risk }: { risk: FraudCheck["risk"] }) {
  return <Badge tone={riskTone[risk]}>{riskLabel[risk]}</Badge>;
}

export function FraudResult({ data }: { data: FraudCheck }) {
  const rateColor = data.success_rate >= 80 ? "bg-emerald-500" : data.success_rate >= 50 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-display text-lg font-bold text-navy">{data.phone}</span>
        <RiskBadge risk={data.risk} />
        {data.blacklisted && <Badge tone="red">Blacklisted</Badge>}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[["Total", data.total, "text-navy"], ["Delivered", data.delivered, "text-emerald-600"], ["Cancelled", data.cancelled, "text-rose-600"]].map(([l, v, c]) => (
          <div key={l as string} className="rounded-xl bg-surface p-3">
            <p className={cn("font-display text-2xl font-bold", c as string)}>{v}</p>
            <p className="text-xs text-muted">{l}</p>
          </div>
        ))}
      </div>
      <div>
        <div className="mb-1 flex justify-between text-sm"><span className="font-medium text-navy">Success rate</span><span className="font-display font-bold text-navy">{data.success_rate}%</span></div>
        <div className="h-3 overflow-hidden rounded-full bg-surface"><div className={cn("h-full rounded-full", rateColor)} style={{ width: `${data.success_rate}%` }} /></div>
      </div>
      <div className="space-y-2.5">
        {data.couriers.map((c) => {
          const rate = c.total ? Math.round((c.delivered / c.total) * 100) : 0;
          return (
            <div key={c.name}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-navy">{c.name}</span>
                <span className="font-display text-muted">{c.delivered}/{c.total} · {c.total ? `${rate}%` : "—"}</span>
              </div>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-surface">
                <div className="bg-emerald-500" style={{ width: c.total ? `${(c.delivered / c.total) * 100}%` : 0 }} />
                <div className="bg-rose-400" style={{ width: c.total ? `${(c.cancelled / c.total) * 100}%` : 0 }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="rounded-xl border border-line p-3 text-sm">
        <p className="mb-1 font-semibold text-navy">Our store history</p>
        <p className="font-display text-muted">Orders {data.local.orders} · Delivered {data.local.delivered} · Cancelled {data.local.cancelled} · Returned {data.local.returned}</p>
      </div>
    </div>
  );
}

export function FraudCheckButton({ phone, size = "sm", label = "Fraud check" }: { phone: string; size?: "sm" | "md"; label?: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<FraudCheck | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const run = async () => {
    setOpen(true);
    setErr(null);
    setData(null);
    try {
      const r = await adminApi.get<{ data: FraudCheck }>("/fraud-check", { phone: normalizePhone(phone) });
      setData(r.data);
    } catch (e) {
      setErr(errorMessage(e));
    }
  };
  return (
    <>
      <Button size={size} variant="outline" onClick={run} icon={<ShieldAlert className="h-4 w-4 text-amber-600" />} title="Fraud check">
        {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Fraud check">
        {err ? <p className="text-rose-600">{err}</p> : data ? <FraudResult data={data} /> : <Spinner />}
      </Modal>
    </>
  );
}

export function ImageUpload({ value, onChange, label = "Image", className }: { value: string | null | undefined; onChange: (url: string | null) => void; label?: string; className?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const r = await adminApi.upload(file);
      onChange(r.url);
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium text-navy">{label}</span>
      <div className="flex items-center gap-3">
        <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-line bg-surface">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-muted" aria-hidden="true" />}
          {value && (
            <button type="button" onClick={() => onChange(null)} className="absolute top-1 right-1 rounded-full bg-white/90 p-0.5 text-rose-600" aria-label="Remove image"><X className="h-3.5 w-3.5" /></button>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Button size="sm" variant="outline" loading={busy} onClick={() => input.current?.click()} icon={<Upload className="h-4 w-4" />}>Upload</Button>
          <input ref={input} type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} aria-label={`${label} file`} />
          <input type="url" placeholder="or paste URL" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} className="h-8 w-48 rounded-lg border border-line px-2 text-xs focus:border-teal focus:outline-none" aria-label={`${label} URL`} />
        </div>
      </div>
    </div>
  );
}

export function GalleryUpload({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const urls: string[] = [];
    for (const f of Array.from(files)) {
      try {
        urls.push((await adminApi.upload(f)).url);
      } catch (e) {
        toast(errorMessage(e), "error");
      }
    }
    onChange([...value, ...urls]);
    setBusy(false);
    if (input.current) input.current.value = "";
  };
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-navy">Gallery images</span>
      <div className="flex flex-wrap gap-2">
        {value.map((u, i) => (
          <div key={u + i} className="relative h-20 w-20 overflow-hidden rounded-xl border border-line">
            <img src={u} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute top-1 right-1 rounded-full bg-white/90 p-0.5 text-rose-600" aria-label="Remove image"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <button type="button" onClick={() => input.current?.click()} className="grid h-20 w-20 place-items-center rounded-xl border border-dashed border-line text-muted hover:border-teal hover:text-teal-dark" aria-label="Add images">
          {busy ? <Spinner label="" /> : <ImagePlus className="h-6 w-6" />}
        </button>
        <input ref={input} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => pick(e.target.files)} aria-label="Gallery files" />
      </div>
    </div>
  );
}

export function RangeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const opts = [["today", "Today"], ["7d", "Last 7 days"], ["30d", "Last 30 days"], ["month", "This month"]];
  return (
    <div className="inline-flex rounded-xl border border-line bg-white p-1" role="group" aria-label="Date range">
      {opts.map(([v, l]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)} className={cn("rounded-lg px-3 py-1.5 text-sm font-medium", value === v ? "bg-navy text-white" : "text-navy hover:bg-surface")}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function ConfirmButton({ onConfirm, children, message = "Are you sure?", ...rest }: { onConfirm: () => void; children: ReactNode; message?: string } & Omit<React.ComponentProps<typeof Button>, "onClick">) {
  return (
    <Button {...rest} onClick={() => { if (window.confirm(message)) onConfirm(); }}>
      {children}
    </Button>
  );
}
