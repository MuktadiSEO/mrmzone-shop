/**
 * Typed API client — single place for base URL, auth header and error handling.
 * Works in server components (catalog pages, with ISR revalidate) and in the browser.
 * When NEXT_PUBLIC_DEMO_MODE=true every request is answered by lib/demo-api.ts instead.
 */
import type {
  AuthResponse, Category, CheckoutBody, CmsPage, CouponResult, HomeData, LandingPage,
  Order, Paginated, Product, ProductCard, Review, Single, StoreSettings, User,
} from "./types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mrmzone.shop").replace(/\/$/, "");
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const CUSTOMER_TOKEN_KEY = "mrm_token";
export const ADMIN_TOKEN_KEY = "mrm_admin_token";
export const ADMIN_USER_KEY = "mrm_admin_user";

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;
  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
  /** First validation message for a field, if any */
  field(name: string): string | undefined {
    return this.errors?.[name]?.[0];
  }
}

export type Query = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
  /** which stored token to send (browser only) */
  auth?: "customer" | "admin";
  /** explicit token (overrides `auth`) */
  token?: string | null;
  /** ISR revalidate seconds for server-side GETs; false = no-store */
  revalidate?: number | false;
  signal?: AbortSignal;
}

export function buildQuery(query?: Query): string {
  if (!query) return "";
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

function storedToken(kind: "customer" | "admin"): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(kind === "admin" ? ADMIN_TOKEN_KEY : CUSTOMER_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const token = opts.token ?? (opts.auth ? storedToken(opts.auth) : null);

  if (DEMO_MODE) {
    const { demoRequest } = await import("./demo-api");
    return demoRequest<T>(method, path, opts.query ?? {}, opts.body, token);
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  let body: BodyInit | undefined;
  if (opts.body instanceof FormData) {
    body = opts.body;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const init: RequestInit & { next?: { revalidate?: number } } = { method, headers, body, signal: opts.signal };
  if (typeof window === "undefined" && method === "GET") {
    if (opts.revalidate === false) init.cache = "no-store";
    else init.next = { revalidate: opts.revalidate ?? 60 };
  }

  let res: Response;
  try {
    // On the server (SSR/ISR) use the internal Docker network address when available.
    const base = typeof window === "undefined" && process.env.API_INTERNAL_URL ? process.env.API_INTERNAL_URL.replace(/\/$/, "") : API_URL;
    res = await fetch(`${base}${path}${buildQuery(opts.query)}`, init);
  } catch {
    throw new ApiError("সার্ভারের সাথে সংযোগ করা যাচ্ছে না। ইন্টারনেট সংযোগ চেক করুন।", 0);
  }

  if (res.status === 204) return undefined as T;
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    const j = (json ?? {}) as { message?: string; errors?: Record<string, string[]> };
    if (res.status === 401 && typeof window !== "undefined" && opts.auth === "admin") {
      try {
        window.localStorage.removeItem(ADMIN_TOKEN_KEY);
      } catch {
        /* ignore */
      }
    }
    throw new ApiError(j.message || `Request failed (${res.status})`, res.status, j.errors ?? {});
  }
  return json as T;
}

/** For server components: never throw, return fallback when the API is down. */
export async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    const first = Object.values(e.errors ?? {})[0]?.[0];
    return first || e.message;
  }
  if (e instanceof Error) return e.message;
  return "কিছু একটা সমস্যা হয়েছে।";
}

// ---------------- Storefront ----------------

export const defaultSettings: StoreSettings = {
  name: "MRM Zone Shop",
  logo: null,
  phone: "01302919979",
  whatsapp: "8801302919979",
  email: "support@mrmzone.shop",
  address: "ঢাকা, বাংলাদেশ",
  facebook: "https://facebook.com/mrmzoneshop",
  delivery: { inside_dhaka: 70, outside_dhaka: 130, free_delivery_min_qty: 2 },
  payment_methods: ["cod"],
  announcement: "সারা বাংলাদেশে ক্যাশ অন ডেলিভারি",
  meta_pixel_id: null,
  gtm_id: null,
};

/** /settings is returned either bare or wrapped in {data}; accept both. */
function unwrap<T>(r: T | Single<T>): T {
  if (r && typeof r === "object" && "data" in (r as object) && Object.keys(r as object).length === 1) {
    return (r as Single<T>).data;
  }
  return r as T;
}

export const shopApi = {
  settings: async () => unwrap(await request<StoreSettings | Single<StoreSettings>>("/settings", { revalidate: 300 })),
  home: async () => unwrap(await request<HomeData | Single<HomeData>>("/home", { revalidate: 60 })),
  categories: () => request<{ data: Category[] }>("/categories", { revalidate: 300 }),
  category: (slug: string) => request<Single<Category>>(`/categories/${encodeURIComponent(slug)}`, { revalidate: 300 }),
  products: (query: Query) => request<Paginated<ProductCard>>("/products", { query, revalidate: 60 }),
  product: (slug: string) => request<Single<Product>>(`/products/${encodeURIComponent(slug)}`, { revalidate: 60 }),
  reviews: (slug: string, page = 1) => request<Paginated<Review>>(`/products/${encodeURIComponent(slug)}/reviews`, { query: { page }, revalidate: 120 }),
  addReview: (slug: string, body: { name: string; rating: number; comment: string }) =>
    request<Single<Review>>(`/products/${encodeURIComponent(slug)}/reviews`, { method: "POST", body, auth: "customer" }),
  landing: (slug: string) => request<Single<LandingPage>>(`/landing-pages/${encodeURIComponent(slug)}`, { revalidate: 60 }),
  page: async (slug: string) => unwrap(await request<CmsPage | Single<CmsPage>>(`/pages/${encodeURIComponent(slug)}`, { revalidate: 600 })),
  validateCoupon: (code: string, subtotal: number) => request<Single<CouponResult>>("/coupons/validate", { method: "POST", body: { code, subtotal } }),
  draft: (body: { name?: string; phone: string; address?: string; items: CheckoutBody["items"] }) =>
    request<Single<{ id: number }>>("/checkout/draft", { method: "POST", body }),
  placeOrder: (body: CheckoutBody) => request<Single<Order>>("/orders", { method: "POST", body, auth: "customer" }),
  track: (number: string, phone: string) => request<Single<Order>>("/orders/track", { query: { number, phone }, revalidate: false }),
};

export const authApi = {
  login: (login: string, password: string, device_name = "web") =>
    request<AuthResponse>("/auth/login", { method: "POST", body: { login, password, device_name } }),
  register: (body: { name: string; phone: string; email?: string; password: string }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body }),
  logout: (auth: "customer" | "admin" = "customer") => request<unknown>("/auth/logout", { method: "POST", auth }),
  me: (auth: "customer" | "admin" = "customer") => request<Single<User>>("/me", { auth }),
  updateMe: (body: Partial<User> & { password?: string }) => request<Single<User>>("/me", { method: "PUT", body, auth: "customer" }),
  myOrders: (page = 1) => request<Paginated<Order>>("/me/orders", { query: { page }, auth: "customer" }),
  wishlist: () => request<{ data: ProductCard[] }>("/me/wishlist", { auth: "customer" }),
  addWishlist: (product_id: number) => request<unknown>("/me/wishlist", { method: "POST", body: { product_id }, auth: "customer" }),
  removeWishlist: (product_id: number) => request<unknown>(`/me/wishlist/${product_id}`, { method: "DELETE", auth: "customer" }),
};

/** Admin helper: all calls send the admin bearer token. */
export const adminApi = {
  get: <T>(path: string, query?: Query) => request<T>(`/admin${path}`, { query, auth: "admin" }),
  post: <T>(path: string, body?: unknown) => request<T>(`/admin${path}`, { method: "POST", body, auth: "admin" }),
  put: <T>(path: string, body?: unknown) => request<T>(`/admin${path}`, { method: "PUT", body, auth: "admin" }),
  del: <T>(path: string) => request<T>(`/admin${path}`, { method: "DELETE", auth: "admin" }),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<{ url: string; path: string }>("/admin/uploads", { method: "POST", body: fd, auth: "admin" });
  },
};
