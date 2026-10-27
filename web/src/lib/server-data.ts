import "server-only";
import { cache } from "react";
import { defaultSettings, safe, shopApi } from "./api";
import type { Category, StoreSettings } from "./types";

export const getSettings = cache(async (): Promise<StoreSettings> => {
  const s = await safe(shopApi.settings(), defaultSettings);
  return { ...defaultSettings, ...s, delivery: { ...defaultSettings.delivery, ...(s?.delivery ?? {}) } };
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const r = await safe(shopApi.categories(), { data: [] as Category[] });
  return Array.isArray(r?.data) ? r.data : [];
});
