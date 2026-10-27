"use client";

import { CrudPage } from "@/components/admin/CrudPage";
import { Badge } from "@/components/ui/Badge";
import type { Staff } from "@/lib/types";

export default function StaffPage() {
  return (
    <CrudPage<Staff>
      title="Staff"
      subtitle="admin: everything · manager: everything except staff & settings · staff: orders, incomplete, customers, fraud check, POS"
      endpoint="/staff"
      columns={[
        { key: "name", label: "Name", render: (s) => <span className="font-medium text-navy">{s.name}</span> },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone", render: (s) => <span className="font-display">{s.phone ?? "—"}</span> },
        { key: "role", label: "Role", render: (s) => <Badge tone={s.role === "admin" ? "navy" : s.role === "manager" ? "indigo" : "teal"}>{s.role}</Badge> },
      ]}
      defaults={{ role: "staff" }}
      toForm={(s) => ({ ...s, password: "" })}
      toBody={(v) => { const b = { ...v }; if (!b.password) delete b.password; return b; }}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone" },
        { name: "role", label: "Role", type: "select", options: [{ value: "admin", label: "Admin" }, { value: "manager", label: "Manager" }, { value: "staff", label: "Staff" }], required: true },
        { name: "password", label: "Password", type: "password", hint: "Leave empty to keep the current password" },
      ]}
    />
  );
}
