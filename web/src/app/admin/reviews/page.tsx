"use client";

import { Check, EyeOff, Star } from "lucide-react";
import { CrudPage } from "@/components/admin/CrudPage";
import { useToast } from "@/components/admin/Toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { adminApi, errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Review } from "@/lib/types";

export default function ReviewsPage() {
  const toast = useToast();
  const setApproved = async (r: Review, is_approved: boolean, reload: () => void) => {
    try {
      await adminApi.put(`/reviews/${r.id}`, { is_approved });
      toast(is_approved ? "Approved" : "Hidden");
      reload();
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };
  return (
    <CrudPage<Review>
      title="Reviews"
      subtitle="Customer reviews are hidden until approved"
      endpoint="/reviews"
      canCreate={false}
      canEdit={false}
      columns={[
        { key: "product", label: "Product", render: (r) => <span className="font-medium text-navy">{r.product?.name ?? "—"}</span> },
        { key: "name", label: "Customer" },
        { key: "rating", label: "Rating", render: (r) => <span className="font-display inline-flex items-center gap-1">{r.rating}<Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /></span> },
        { key: "comment", label: "Comment", render: (r) => <span className="line-clamp-2 max-w-sm">{r.comment}</span> },
        { key: "created_at", label: "Date", render: (r) => formatDate(r.created_at) },
        { key: "is_approved", label: "Status", render: (r) => (r.is_approved ? <Badge tone="green">Approved</Badge> : <Badge tone="amber">Pending</Badge>) },
      ]}
      rowActions={(r, reload) =>
        r.is_approved ? (
          <Button size="sm" variant="outline" icon={<EyeOff className="h-3.5 w-3.5" />} onClick={() => setApproved(r, false, reload)}>Hide</Button>
        ) : (
          <Button size="sm" variant="soft" icon={<Check className="h-3.5 w-3.5" />} onClick={() => setApproved(r, true, reload)}>Approve</Button>
        )
      }
    />
  );
}
