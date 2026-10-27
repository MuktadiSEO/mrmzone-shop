"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Category, StoreSettings } from "./types";
import { defaultSettings } from "./api";

const Ctx = createContext<{ settings: StoreSettings; categories: Category[] }>({ settings: defaultSettings, categories: [] });

export function SettingsProvider({ settings, categories, children }: { settings: StoreSettings; categories: Category[]; children: ReactNode }) {
  return <Ctx.Provider value={{ settings, categories }}>{children}</Ctx.Provider>;
}

export function useSettings() {
  return useContext(Ctx).settings;
}

export function useCategories() {
  return useContext(Ctx).categories;
}
