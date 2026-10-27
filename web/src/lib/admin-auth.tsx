"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ADMIN_TOKEN_KEY, ADMIN_USER_KEY, ApiError, authApi } from "./api";
import { readString, writeString } from "./storage";
import type { User } from "./types";

interface AdminAuth {
  user: User | null;
  ready: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
  can: (area: string) => boolean;
}

const Ctx = createContext<AdminAuth | null>(null);

// Areas accessible to each role (API.md "Role permissions")
const STAFF_AREAS = ["dashboard", "orders", "incomplete-orders", "customers", "fraud-check", "pos"];

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    const token = readString(ADMIN_TOKEN_KEY);
    let cached: User | null = null;
    try {
      const raw = readString(ADMIN_USER_KEY);
      cached = raw ? (JSON.parse(raw) as User) : null;
    } catch {
      cached = null;
    }
    if (!token || !cached || cached.role === "customer") {
      setUser(null);
      setReady(true);
      if (!isLogin) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setUser(cached);
    setReady(true);
    // re-validate in the background; a 401 clears the session
    authApi.me("admin").then((r) => {
      if (r.data.role === "customer") throw new ApiError("Forbidden", 403);
      setUser(r.data);
      writeString(ADMIN_USER_KEY, JSON.stringify(r.data));
    }).catch((e) => {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        writeString(ADMIN_TOKEN_KEY, null);
        writeString(ADMIN_USER_KEY, null);
        setUser(null);
        router.replace("/admin/login");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogin]);

  const login = useCallback(async (id: string, password: string) => {
    const r = await authApi.login(id, password, "admin-panel");
    if (!r.user || r.user.role === "customer") throw new ApiError("এই অ্যাকাউন্টের অ্যাডমিন প্যানেলে প্রবেশাধিকার নেই", 403);
    writeString(ADMIN_TOKEN_KEY, r.token);
    writeString(ADMIN_USER_KEY, JSON.stringify(r.user));
    setUser(r.user);
  }, []);

  const logout = useCallback(() => {
    authApi.logout("admin").catch(() => {});
    writeString(ADMIN_TOKEN_KEY, null);
    writeString(ADMIN_USER_KEY, null);
    setUser(null);
    router.replace("/admin/login");
  }, [router]);

  const can = useCallback((area: string) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (user.role === "manager") return area !== "staff" && area !== "settings";
    return STAFF_AREAS.includes(area);
  }, [user]);

  return <Ctx.Provider value={{ user, ready, login, logout, can }}>{children}</Ctx.Provider>;
}

export function useAdmin() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdmin must be used inside <AdminAuthProvider>");
  return c;
}
