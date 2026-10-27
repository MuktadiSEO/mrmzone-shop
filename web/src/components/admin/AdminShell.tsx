"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Award, Boxes, ChartColumn, ExternalLink, FileClock, FileText, FolderTree, Image as ImageIcon, LayoutDashboard, LogOut, Menu,
  MessageSquareText, Package, PanelsTopLeft, ScanBarcode, Settings, ShieldAlert, ShoppingCart, TicketPercent, Truck, UserCog,
  Users, Wallet, MessageSquareMore, ChevronDown, X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAdmin } from "@/lib/admin-auth";
import { cn } from "@/lib/format";
import { DEMO_MODE } from "@/lib/api";
import { Spinner } from "@/components/ui/misc";

export const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, area: "dashboard" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, area: "orders" },
  { href: "/admin/incomplete-orders", label: "Incomplete Orders", icon: FileClock, area: "incomplete-orders" },
  { href: "/admin/pos", label: "POS", icon: ScanBarcode, area: "pos" },
  { href: "/admin/products", label: "Products", icon: Package, area: "products" },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, area: "categories" },
  { href: "/admin/brands", label: "Brands", icon: Award, area: "brands" },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon, area: "banners" },
  { href: "/admin/landing-pages", label: "Landing Pages", icon: PanelsTopLeft, area: "landing-pages" },
  { href: "/admin/customers", label: "Customers", icon: Users, area: "customers" },
  { href: "/admin/fraud-check", label: "Fraud Check", icon: ShieldAlert, area: "fraud-check" },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent, area: "coupons" },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareText, area: "reviews" },
  { href: "/admin/purchases", label: "Suppliers & Purchases", icon: Truck, area: "purchases" },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes, area: "inventory" },
  { href: "/admin/expenses", label: "Expenses / Accounting", icon: Wallet, area: "expenses" },
  { href: "/admin/reports", label: "Reports", icon: ChartColumn, area: "reports" },
  { href: "/admin/sms", label: "SMS", icon: MessageSquareMore, area: "sms" },
  { href: "/admin/pages", label: "CMS Pages", icon: FileText, area: "pages" },
  { href: "/admin/staff", label: "Staff", icon: UserCog, area: "staff" },
  { href: "/admin/settings", label: "Settings", icon: Settings, area: "settings" },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { can } = useAdmin();
  return (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-5">
        <Link href="/admin" onClick={onNavigate}><Logo variant="light" size={34} /></Link>
      </div>
      <ul className="scrollbar-none flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {NAV.filter((n) => can(n.area)).map((n) => {
          const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
          const Icon = n.icon;
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-[0.88rem] font-medium transition-colors",
                  active ? "bg-white/12 text-white" : "text-white/70 hover:bg-white/6 hover:text-white",
                )}
              >
                <Icon className={cn("h-[18px] w-[18px]", active ? "text-cyan" : "text-white/60")} aria-hidden="true" />
                {n.label}
                {active && <span className="brand-gradient ml-auto h-1.5 w-1.5 rounded-full" aria-hidden="true" />}
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="border-t border-white/10 px-5 py-3 text-[0.7rem] text-white/40">MRM Zone Shop · Admin v1</p>
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, ready, logout } = useAdmin();
  const [mobile, setMobile] = useState(false);
  const [menu, setMenu] = useState(false);

  // bare pages: login and printable invoice
  if (pathname === "/admin/login" || pathname.endsWith("/invoice")) return <>{children}</>;
  if (!ready || !user) return <div className="grid min-h-dvh place-items-center bg-surface"><Spinner /></div>;

  const current = NAV.find((n) => (n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href)));

  return (
    <div className="min-h-dvh bg-surface">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-navy lg:block">
        <Sidebar />
      </aside>
      {mobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-navy/60" aria-label="Close menu" onClick={() => setMobile(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-navy shadow-pop">
            <button type="button" className="absolute top-4 right-3 rounded-lg p-1.5 text-white/70 hover:bg-white/10" onClick={() => setMobile(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
            <Sidebar onNavigate={() => setMobile(false)} />
          </aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white px-3 sm:px-6">
          <button type="button" className="rounded-lg p-2 text-navy hover:bg-surface lg:hidden" onClick={() => setMobile(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <h1 className="truncate text-base font-semibold text-navy sm:text-lg">{current?.label ?? "Admin"}</h1>
          {DEMO_MODE && <span className="hidden rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 sm:inline">DEMO</span>}
          <div className="ml-auto flex items-center gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-navy hover:border-teal hover:text-teal-dark sm:inline-flex">
              <ExternalLink className="h-4 w-4" aria-hidden="true" /> Visit website
            </a>
            <div className="relative">
              <button type="button" onClick={() => setMenu((v) => !v)} aria-expanded={menu} aria-haspopup="menu" className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-surface">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-teal text-sm font-bold text-white">{user.name.slice(0, 1).toUpperCase()}</span>
                <span className="hidden text-left leading-tight md:block">
                  <span className="block text-sm font-semibold text-navy">{user.name}</span>
                  <span className="block text-xs text-muted capitalize">{user.role}</span>
                </span>
                <ChevronDown className="h-4 w-4 text-muted" aria-hidden="true" />
              </button>
              {menu && (
                <div role="menu" className="absolute right-0 mt-2 w-52 rounded-xl border border-line bg-white p-1.5 shadow-pop" onMouseLeave={() => setMenu(false)}>
                  <p className="px-3 py-2 text-xs text-muted">{user.email ?? user.phone}</p>
                  <a role="menuitem" href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-navy hover:bg-surface sm:hidden"><ExternalLink className="h-4 w-4" /> Visit website</a>
                  <button role="menuitem" type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"><LogOut className="h-4 w-4" /> Logout</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="p-3 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
