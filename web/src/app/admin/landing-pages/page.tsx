"use client";

import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { adminApi, errorMessage } from "@/lib/api";
import { useAdminQuery } from "@/lib/use-admin-query";
import type { LandingPage, Paginated } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyRow, Table, Td, Th } from "@/components/ui/Table";
import { Alert, Spinner } from "@/components/ui/misc";
import { ConfirmButton, PageHeader } from "@/components/admin/common";
import { useToast } from "@/components/admin/Toast";

export default function LandingPagesPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useAdminQuery<Paginated<LandingPage & { id: number }>>("/landing-pages");
  return (
    <>
      <PageHeader title="Landing pages" subtitle="Single-product pages for Facebook ads (/lp/slug)" actions={<ButtonLink href="/admin/landing-pages/new" variant="accent" icon={<Plus className="h-4 w-4" />}>New landing page</ButtonLink>} />
      <Card>
        {error && <div className="p-3"><Alert>{error}</Alert></div>}
        <Table>
          <thead><tr><Th>Title</Th><Th>Product</Th><Th>URL</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead>
          <tbody>
            {loading && !data ? <EmptyRow colSpan={5}><Spinner /></EmptyRow> : !data?.data.length ? <EmptyRow colSpan={5}>No landing pages yet</EmptyRow> : data.data.map((lp) => (
              <tr key={lp.id} className="hover:bg-surface/60">
                <Td><span className="flex items-center gap-2 font-medium text-navy"><span className="h-3 w-3 rounded-full" style={{ background: lp.theme_color ?? "#078080" }} aria-hidden="true" />{lp.title}</span><span className="block max-w-sm truncate text-xs text-muted">{lp.headline}</span></Td>
                <Td>{lp.product?.name ?? "—"}</Td>
                <Td><a href={`/lp/${lp.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-teal-dark hover:underline">/lp/{lp.slug}<ExternalLink className="h-3 w-3" /></a></Td>
                <Td>{lp.is_active === false ? <Badge>Off</Badge> : <Badge tone="green">Live</Badge>}</Td>
                <Td className="text-right">
                  <div className="inline-flex gap-1.5">
                    <ButtonLink href={`/admin/landing-pages/${lp.id}`} size="sm" variant="outline" icon={<Pencil className="h-3.5 w-3.5" />}>Edit</ButtonLink>
                    <ConfirmButton size="sm" variant="ghost" className="text-rose-600" aria-label="Delete" onConfirm={async () => { try { await adminApi.del(`/landing-pages/${lp.id}`); toast("Deleted"); reload(); } catch (e) { toast(errorMessage(e), "error"); } }}><Trash2 className="h-4 w-4" /></ConfirmButton>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
