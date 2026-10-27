"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Save } from "lucide-react";
import { adminApi, errorMessage } from "@/lib/api";
import { useAdminQuery } from "@/lib/use-admin-query";
import { cn } from "@/lib/format";
import type { AdminSettings } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Input";
import { Alert, Spinner } from "@/components/ui/misc";
import { ImageUpload, PageHeader } from "@/components/admin/common";
import { useToast } from "@/components/admin/Toast";

const EMPTY: AdminSettings = {
  store: { name: "MRM Zone Shop", phone: "", whatsapp: "", email: "", address: "", facebook: "", logo: null, announcement: "" },
  delivery: { inside_dhaka: 70, outside_dhaka: 130, free_delivery_min_qty: 0 },
  courier: { default: "steadfast", steadfast: { api_key: "", secret_key: "" }, pathao: { base_url: "https://api-hermes.pathao.com", client_id: "", client_secret: "", username: "", password: "", store_id: "" }, redx: { token: "", default_area_id: "" } },
  sms: { provider: "log", api_key: "", sender_id: "" },
  tracking: { meta_pixel_id: "", gtm_id: "" },
  fraud: { api_key: "", api_url: "https://bdcourier.com/api/courier-check" },
  sms_templates: { order_placed: "", order_confirmed: "", order_shipped: "", enabled: { order_placed: true, order_confirmed: true, order_shipped: true } },
};

type Rec = Record<string, unknown>;
function merge<T>(base: T, over: unknown): T {
  if (!over || typeof over !== "object" || Array.isArray(over)) return (over ?? base) as T;
  const out: Rec = { ...(base as Rec) };
  for (const [k, v] of Object.entries(over as Rec)) out[k] = v && typeof v === "object" && !Array.isArray(v) && out[k] && typeof out[k] === "object" ? merge(out[k], v) : v ?? out[k];
  return out as T;
}

const TABS = [
  ["store", "Store info"], ["delivery", "Delivery charges"], ["courier", "Courier API"], ["sms", "SMS gateway"], ["tracking", "Tracking"], ["templates", "Auto SMS"],
] as const;

function Section({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <div className="border-b border-line p-4 last:border-0 sm:p-5">
      <h3 className="font-semibold text-navy">{title}</h3>
      {desc && <p className="mb-3 text-sm text-muted">{desc}</p>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const { data, loading, error } = useAdminQuery<{ data: AdminSettings } | AdminSettings>("/settings");
  const [s, setS] = useState<AdminSettings>(EMPTY);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("store");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    const raw = "data" in data && data.data ? data.data : data;
    setS(merge(EMPTY, raw));
  }, [data]);

  const upd = <K extends keyof AdminSettings>(k: K, v: Partial<AdminSettings[K]>) => setS((x) => ({ ...x, [k]: { ...x[k], ...v } }));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await adminApi.put("/settings", s);
      toast("Settings saved");
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) return <div className="py-20 text-center"><Spinner /></div>;
  const c = s.courier;

  return (
    <form onSubmit={save}>
      <PageHeader title="Settings" actions={<Button type="submit" variant="accent" loading={busy} icon={<Save className="h-4 w-4" />}>Save settings</Button>} />
      {error && <div className="mb-3"><Alert>{error}</Alert></div>}
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <nav className="scrollbar-none flex gap-1 overflow-x-auto lg:flex-col" role="tablist" aria-label="Settings sections">
          {TABS.map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("rounded-xl px-3 py-2 text-left text-sm font-semibold whitespace-nowrap", tab === k ? "bg-navy text-white" : "text-navy hover:bg-white")}>{l}</button>
          ))}
        </nav>
        <Card>
          {tab === "store" && (
            <Section title="Store info" desc="Shown in the header, footer, invoices and WhatsApp buttons.">
              <Input label="Store name" value={s.store.name} onChange={(e) => upd("store", { name: e.target.value })} />
              <Input label="Hotline phone" value={s.store.phone} onChange={(e) => upd("store", { phone: e.target.value })} className="font-display" />
              <Input label="WhatsApp (with 880)" value={s.store.whatsapp} onChange={(e) => upd("store", { whatsapp: e.target.value })} placeholder="8801302919979" className="font-display" />
              <Input label="Email" type="email" value={s.store.email} onChange={(e) => upd("store", { email: e.target.value })} />
              <Input label="Facebook page URL" value={s.store.facebook} onChange={(e) => upd("store", { facebook: e.target.value })} />
              <Input label="Address" value={s.store.address} onChange={(e) => upd("store", { address: e.target.value })} />
              <Textarea label="Announcement bar" value={s.store.announcement ?? ""} onChange={(e) => upd("store", { announcement: e.target.value })} rows={2} wrapClassName="sm:col-span-2" />
              <ImageUpload label="Logo (optional, SVG logo is built in)" value={s.store.logo} onChange={(u) => upd("store", { logo: u })} className="sm:col-span-2" />
            </Section>
          )}
          {tab === "delivery" && (
            <Section title="Delivery charges" desc="Used by checkout, landing pages and order editing.">
              <Input label="Inside Dhaka (৳)" type="number" value={s.delivery.inside_dhaka} onChange={(e) => upd("delivery", { inside_dhaka: Number(e.target.value) })} className="font-display" />
              <Input label="Outside Dhaka (৳)" type="number" value={s.delivery.outside_dhaka} onChange={(e) => upd("delivery", { outside_dhaka: Number(e.target.value) })} className="font-display" />
              <Input label="Free delivery from quantity" type="number" value={s.delivery.free_delivery_min_qty} onChange={(e) => upd("delivery", { free_delivery_min_qty: Number(e.target.value) })} hint="0 = disabled" className="font-display" />
            </Section>
          )}
          {tab === "courier" && (
            <>
              <Section title="Default courier" desc="Used by bulk “Send to courier” and when no courier is chosen on an order.">
                <Select label="Default courier" value={c.default} onChange={(e) => upd("courier", { default: e.target.value as AdminSettings["courier"]["default"] })}>
                  <option value="steadfast">Steadfast</option><option value="pathao">Pathao</option><option value="redx">RedX</option>
                </Select>
              </Section>
              <Section title="Steadfast" desc="portal.packzy.com → API settings">
                <Input label="API key" value={c.steadfast.api_key} onChange={(e) => upd("courier", { steadfast: { ...c.steadfast, api_key: e.target.value } })} autoComplete="off" />
                <Input label="Secret key" type="password" value={c.steadfast.secret_key} onChange={(e) => upd("courier", { steadfast: { ...c.steadfast, secret_key: e.target.value } })} autoComplete="new-password" />
              </Section>
              <Section title="Pathao" desc="merchant.pathao.com → Developers API">
                <Input label="Client ID" value={c.pathao.client_id} onChange={(e) => upd("courier", { pathao: { ...c.pathao, client_id: e.target.value } })} autoComplete="off" />
                <Input label="Client secret" type="password" value={c.pathao.client_secret} onChange={(e) => upd("courier", { pathao: { ...c.pathao, client_secret: e.target.value } })} autoComplete="new-password" />
                <Input label="Username (email)" value={c.pathao.username} onChange={(e) => upd("courier", { pathao: { ...c.pathao, username: e.target.value } })} autoComplete="off" />
                <Input label="Password" type="password" value={c.pathao.password} onChange={(e) => upd("courier", { pathao: { ...c.pathao, password: e.target.value } })} autoComplete="new-password" />
                <Input label="Store ID" value={c.pathao.store_id} onChange={(e) => upd("courier", { pathao: { ...c.pathao, store_id: e.target.value } })} />
                <Input label="API base URL" value={c.pathao.base_url} onChange={(e) => upd("courier", { pathao: { ...c.pathao, base_url: e.target.value } })} hint="Live: https://api-hermes.pathao.com · Sandbox: https://courier-api-sandbox.pathao.com" wrapClassName="sm:col-span-2" />
              </Section>
              <Section title="RedX" desc="redx.com.bd → Developer API">
                <Input label="Access token" type="password" value={c.redx.token} onChange={(e) => upd("courier", { redx: { ...c.redx, token: e.target.value } })} autoComplete="new-password" />
                <Input label="Default delivery area ID" value={c.redx.default_area_id} onChange={(e) => upd("courier", { redx: { ...c.redx, default_area_id: e.target.value } })} hint="From RedX area list; used when an order has no area set" />
              </Section>
              <Section title="Fraud check (optional)" desc="Courier-wide delivery history for a phone number. Without a key, only this shop's own order history is used.">
                <Input label="API key (bdcourier.com)" type="password" value={s.fraud.api_key} onChange={(e) => upd("fraud", { api_key: e.target.value })} autoComplete="new-password" />
                <Input label="API URL" value={s.fraud.api_url} onChange={(e) => upd("fraud", { api_url: e.target.value })} />
              </Section>
            </>
          )}
          {tab === "sms" && (
            <Section title="SMS gateway" desc="Used for bulk SMS and automatic order notifications.">
              <Select label="Provider" value={s.sms.provider} onChange={(e) => upd("sms", { provider: e.target.value })}>
                <option value="log">Log only (no SMS sent — testing)</option>
                <option value="bulksmsbd">BulkSMSBD (bulksmsbd.net)</option>
              </Select>
              <Input label="Sender ID" value={s.sms.sender_id} onChange={(e) => upd("sms", { sender_id: e.target.value })} />
              <Input label="API key" type="password" value={s.sms.api_key} onChange={(e) => upd("sms", { api_key: e.target.value })} wrapClassName="sm:col-span-2" autoComplete="new-password" />
            </Section>
          )}
          {tab === "tracking" && (
            <Section title="Tracking" desc="Meta Pixel fires PageView, ViewContent, AddToCart, InitiateCheckout and Purchase (BDT).">
              <Input label="Meta Pixel ID" value={s.tracking.meta_pixel_id} onChange={(e) => upd("tracking", { meta_pixel_id: e.target.value.replace(/\D/g, "") })} className="font-display" placeholder="123456789012345" />
              <Input label="Google Tag Manager ID" value={s.tracking.gtm_id} onChange={(e) => upd("tracking", { gtm_id: e.target.value })} className="font-display" placeholder="GTM-XXXXXXX" />
            </Section>
          )}
          {tab === "templates" && (
            <Section title="Auto SMS templates" desc="Variables: {name} {number} {total} {tracking}">
              {(["order_placed", "order_confirmed", "order_shipped"] as const).map((k) => (
                <div key={k} className="space-y-1.5 sm:col-span-2">
                  <Checkbox label={`Send on ${k.replace("order_", "order ")}`} checked={!!s.sms_templates.enabled?.[k]} onChange={(e) => upd("sms_templates", { enabled: { ...s.sms_templates.enabled, [k]: e.target.checked } })} />
                  <Textarea label={k.replace(/_/g, " ")} value={s.sms_templates[k]} onChange={(e) => upd("sms_templates", { [k]: e.target.value } as Partial<AdminSettings["sms_templates"]>)} rows={2} />
                </div>
              ))}
            </Section>
          )}
        </Card>
      </div>
    </form>
  );
}
