"use client";

import { CrudPage } from "@/components/admin/CrudPage";
import { ButtonLink } from "@/components/ui/Button";
import { formatDate, money } from "@/lib/format";
import type { Expense } from "@/lib/types";

const CATS = ["Facebook Ads", "Packaging", "Courier", "Salary", "Office rent", "Utility", "Product purchase", "Other"];

export default function ExpensesPage() {
  return (
    <CrudPage<Expense>
      title="Expenses"
      subtitle="Ad spend, packaging, salaries and other costs (used in net profit)"
      endpoint="/expenses"
      headerActions={<ButtonLink href="/admin/reports" variant="outline">Profit & loss report</ButtonLink>}
      columns={[
        { key: "date", label: "Date", render: (e) => formatDate(e.date) },
        { key: "category", label: "Category", render: (e) => <span className="font-medium text-navy">{e.category}</span> },
        { key: "amount", label: "Amount", render: (e) => <span className="font-display font-semibold">{money(e.amount)}</span> },
        { key: "note", label: "Note", render: (e) => e.note ?? "—" },
      ]}
      defaults={{ date: new Date().toISOString().slice(0, 10), category: "Facebook Ads" }}
      fields={[
        { name: "category", label: "Category", type: "select", options: CATS.map((c) => ({ value: c, label: c })), required: true },
        { name: "amount", label: "Amount (৳)", type: "number", required: true },
        { name: "date", label: "Date", type: "date", required: true },
        { name: "note", label: "Note", type: "textarea" },
      ]}
    />
  );
}
