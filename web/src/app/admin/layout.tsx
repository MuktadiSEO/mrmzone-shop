import type { Metadata } from "next";
import { AdminAuthProvider } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ToastProvider } from "@/components/admin/Toast";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · MRM Zone Admin" }, robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <ToastProvider>
        <AdminShell>{children}</AdminShell>
      </ToastProvider>
    </AdminAuthProvider>
  );
}
