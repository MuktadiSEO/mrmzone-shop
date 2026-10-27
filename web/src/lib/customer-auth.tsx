"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, CUSTOMER_TOKEN_KEY } from "./api";
import { readString, writeString } from "./storage";
import type { User } from "./types";

interface AuthCtx {
  user: User | null;
  token: string | null;
  ready: boolean;
  setSession: (token: string, user: User) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const USER_KEY = "mrm_user";

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = readString(CUSTOMER_TOKEN_KEY);
    let u: User | null = null;
    try {
      const raw = readString(USER_KEY);
      u = raw ? (JSON.parse(raw) as User) : null;
    } catch {
      u = null;
    }
    setToken(t);
    setUser(t ? u : null);
    setReady(true);
    if (t) {
      authApi.me("customer").then((r) => {
        setUser(r.data);
        writeString(USER_KEY, JSON.stringify(r.data));
      }).catch(() => { /* keep cached user; token may be offline */ });
    }
  }, []);

  const setSession = useCallback((t: string, u: User) => {
    writeString(CUSTOMER_TOKEN_KEY, t);
    writeString(USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    authApi.logout("customer").catch(() => {});
    writeString(CUSTOMER_TOKEN_KEY, null);
    writeString(USER_KEY, null);
    setToken(null);
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, token, ready, setSession, logout }}>{children}</Ctx.Provider>;
}

export function useCustomer() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCustomer must be used inside <CustomerAuthProvider>");
  return c;
}
