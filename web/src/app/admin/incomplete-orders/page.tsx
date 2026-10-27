"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, PhoneCall, Trash2 } from "lucide-react";
import { adminApi, errorMessage } from "@/lib/api";
import { useAdminQuery } from "@/lib/use-admin-query";
import { formatDate, money } from "@/lib/format";
import type { IncompleteOrder, Order, Paginated } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyRow, Table, Td, Th } from "@/components/ui/Table";
import { Alert, Spinner } from "@/components/ui/misc";
import { AdminPager, ConfirmButton, FraudCheckButton, PageHeader } from "@/components/admin/common";
import { useToast } from "@/components/admin/Toast";

export default function IncompleteOrdersPage() {
  const router = useRouter();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAdminQuery<Paginated<IncompleteOrder>>("/incomplete-orders", { page });
  const [busy, setBusy] = useState<number | null>(null);

  const convert = async (r: IncompleteOrder) => {
    setBusy(r.id);
    try {
      const res = await adminApi.post<{ data: Order }>(`/incomplete-orders/${r.id}/convert`);
      toast("Converted to order");
      if (res?.data?.id) router.push(`/admin/orders/${res.data.id}`);
      else reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setBusy(null);
    }
  };
  const remove = async (r: IncompleteOrder) => {
    try {
      await adminApi.del(`/incomplete-orders/${r.id}`);
      toast("Deleted");
      reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  return (
    <>
      <PageHeader title="Incomplete orders" subtitle="Customers who entered their phone at checkout but didn't place the order — call and convert them" />
      <Card>
        {error && <div className="p-3"><Alert>{error}</Alert></div>}
        <Table>
          <thead><tr><Th>Customer</Th><Th>Products</Th><Th>Value</Th><Th>Time</Th><Th className="text-right">Actions</Th></tr></thead>
          <tbody>
            {loading && !data ? <EmptyRow colSpan={5}><Spinner /></EmptyRow> : !data?.data.length ? <EmptyRow colSpan={5}>No incomplete orders 🎉</EmptyRow> : data.data.map((r) => (
              <tr key={r.id} className="hover:bg-surface/60">
                <Td>
                  <span className="font-medium text-navy">{r.name || "Unknown"}</span>
                  <span className="font-display block text-sm">{r.phone}</span>
                  {r.address && <span className="block max-w-[220px] truncate text-xs text-muted">{r.address}</span>}
                </Td>
                <Td className="text-xs">{r.items.map((i) => `${i.name ?? `#${i.product_id}`} ×${i.quantity}`).join(", ")}</Td>
                <Td className="font-display font-semibold">{r.total !== undefined ? money(r.total) : "—"}</Td>
                <Td className="text-xs text-muted">{formatDate(r.created_at, true)}</Td>
                <Td className="text-right">
                  <div className="inline-flex flex-wrap justify-end gap-1.5">
                    <ButtonLink href={`tel:${r.phone}`} size="sm" variant="soft" icon={<PhoneCall className="h-3.5 w-3.5" />}>Call</ButtonLink>
                    <FraudCheckButton phone={r.phone} label="Fraud" />
                    <Button size="sm" variant="primary" loading={busy === r.id} onClick={() => convert(r)} icon={<CheckCircle2 className="h-3.5 w-3.5" />}>Convert</Button>
                    <ConfirmButton size="sm" variant="ghost" className="text-rose-600" message="Delete this incomplete order?" onConfirm={() => remove(r)} aria-label="Delete"><Trash2 className="h-4 w-4" /></ConfirmButton>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {data?.meta && <AdminPager page={data.meta.current_page} last={data.meta.last_page} total={data.meta.total} onPage={setPage} />}
      </Card>
    </>
  );
}
