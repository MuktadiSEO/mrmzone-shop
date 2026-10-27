"use client";

import { useState } from "react";
import { Ban, Search, ShieldCheck } from "lucide-react";
import { adminApi, errorMessage } from "@/lib/api";
import { useAdminQuery } from "@/lib/use-admin-query";
import { formatDate, money } from "@/lib/format";
import type { Customer, Paginated } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyRow, Table, Td, Th } from "@/components/ui/Table";
import { Alert, Spinner } from "@/components/ui/misc";
import { AdminPager, FraudCheckButton, PageHeader } from "@/components/admin/common";
import { useToast } from "@/components/admin/Toast";

export default function CustomersPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const { data, loading, error, reload } = useAdminQuery<Paginated<Customer>>("/customers", { page, search: q });

  const toggle = async (c: Customer) => {
    try {
      if (c.blacklisted) await adminApi.del(`/blacklist/${c.phone}`);
      else {
        const reason = window.prompt(`Blacklist ${c.phone}? Reason:`, "Fake order / not receiving");
        if (reason === null) return;
        await adminApi.post("/blacklist", { phone: c.phone, reason });
      }
      toast(c.blacklisted ? "Removed from blacklist" : "Blacklisted");
      reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  return (
    <>
      <PageHeader title="Customers" subtitle="Grouped by phone number" />
      <Card>
        <form className="flex gap-2 border-b border-line p-3" onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(search); }}>
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input aria-label="Search customers" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or phone" className="h-10 w-full rounded-xl border border-line pr-3 pl-9 text-sm focus:border-teal focus:outline-none" />
          </div>
          <Button type="submit" variant="outline">Search</Button>
        </form>
        {error && <div className="p-3"><Alert>{error}</Alert></div>}
        <Table>
          <thead><tr><Th>Customer</Th><Th>Orders</Th><Th>Total spent</Th><Th>Last order</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead>
          <tbody>
            {loading && !data ? <EmptyRow colSpan={6}><Spinner /></EmptyRow> : !data?.data.length ? <EmptyRow colSpan={6}>No customers</EmptyRow> : data.data.map((c) => (
              <tr key={c.phone} className="hover:bg-surface/60">
                <Td><span className="font-medium text-navy">{c.name}</span><span className="font-display block text-xs">{c.phone}</span></Td>
                <Td className="font-display">{c.orders_count}</Td>
                <Td className="font-display font-semibold">{money(c.total_spent)}</Td>
                <Td className="text-xs text-muted">{formatDate(c.last_order_at)}</Td>
                <Td>{c.blacklisted ? <Badge tone="red">Blacklisted</Badge> : <Badge tone="green">Active</Badge>}</Td>
                <Td className="text-right">
                  <div className="inline-flex gap-1.5">
                    <ButtonLink href={`/admin/orders?search=${c.phone}`} size="sm" variant="outline">Orders</ButtonLink>
                    <FraudCheckButton phone={c.phone} label="Fraud" />
                    <Button size="sm" variant={c.blacklisted ? "soft" : "ghost"} className={c.blacklisted ? "" : "text-rose-600 hover:bg-rose-50"} onClick={() => toggle(c)} icon={c.blacklisted ? <ShieldCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}>
                      {c.blacklisted ? "Unblock" : "Blacklist"}
                    </Button>
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
