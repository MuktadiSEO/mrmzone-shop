/**
 * In-memory mock of docs/API.md, used only when NEXT_PUBLIC_DEMO_MODE=true.
 * State lives in module scope (resets on server restart / page reload in the browser).
 */
import { ApiError, type Query } from "./api";
import {
  buildDemoOrders, demoAdminSettings, demoBanners, demoBrands, demoCard, demoCategories, demoCoupons,
  demoExpenses, demoIncomplete, demoLanding, demoMovements, demoPages, demoProducts, demoPurchases,
  demoReviews, demoSettings, demoSmsLogs, demoStaff, demoSuppliers,
} from "./demo-data";
import { normalizePhone, STATUS_LABELS, BD_PHONE_RE } from "./format";
import type { AdminProduct, Order, OrderStatus, Paginated, User } from "./types";

type AnyRec = Record<string, unknown> & { id?: number };

const db = {
  products: demoProducts as AdminProduct[],
  categories: [...demoCategories] as unknown as AnyRec[],
  brands: [...demoBrands] as unknown as AnyRec[],
  banners: [...demoBanners] as unknown as AnyRec[],
  coupons: [...demoCoupons] as unknown as AnyRec[],
  pages: [...demoPages] as unknown as AnyRec[],
  "landing-pages": [demoLanding()] as unknown as AnyRec[],
  reviews: [...demoReviews] as unknown as AnyRec[],
  suppliers: [...demoSuppliers] as unknown as AnyRec[],
  purchases: [...demoPurchases] as unknown as AnyRec[],
  expenses: [...demoExpenses] as unknown as AnyRec[],
  staff: [...demoStaff] as unknown as AnyRec[],
  orders: buildDemoOrders(),
  incomplete: [...demoIncomplete],
  blacklist: new Set<string>(["01900000000"]),
  smsLogs: [...demoSmsLogs],
  settings: structuredClone(demoAdminSettings),
};

const DEMO_ADMIN: User = { id: 1, name: "MRM Admin", phone: "01302919979", email: "admin@mrmzone.shop", role: "admin" };
const DEMO_CUSTOMER: User = { id: 2, name: "ডেমো কাস্টমার", phone: "01712345678", email: "customer@mrmzone.shop", role: "customer", addresses: [] };

function paginate<T>(items: T[], query: Query, perPageDefault = 20): Paginated<T> {
  const per = Number(query.per_page || perPageDefault);
  const page = Math.max(1, Number(query.page || 1));
  const last = Math.max(1, Math.ceil(items.length / per));
  return { data: items.slice((page - 1) * per, page * per), meta: { current_page: page, last_page: last, per_page: per, total: items.length } };
}

function notFound(): never {
  throw new ApiError("পাওয়া যায়নি", 404);
}

function requireAuth(token: string | null | undefined) {
  if (!token) throw new ApiError("Unauthenticated.", 401);
}

function inRange(iso: string, query: Query): boolean {
  const range = String(query.range || "");
  const t = new Date(iso).getTime();
  const now = Date.now();
  if (query.from && t < new Date(String(query.from)).getTime()) return false;
  if (query.to && t > new Date(String(query.to)).getTime() + 86400000) return false;
  if (range === "today") return new Date(iso).toDateString() === new Date().toDateString();
  if (range === "7d") return t >= now - 7 * 86400000;
  if (range === "30d") return t >= now - 30 * 86400000;
  if (range === "month") { const d = new Date(); return t >= new Date(d.getFullYear(), d.getMonth(), 1).getTime(); }
  return true;
}

function nextId(list: AnyRec[]): number {
  return list.reduce((m, x) => Math.max(m, Number(x.id ?? 0)), 0) + 1;
}

function makeOrder(body: AnyRec, source: string): Order {
  const items = ((body.items as AnyRec[]) || []).map((it, idx) => {
    const p = db.products.find((x) => x.id === Number(it.product_id));
    if (!p) throw new ApiError("পণ্য পাওয়া যায়নি", 422, { items: ["Invalid product"] });
    const v = p.variants.find((x) => x.id === Number(it.variant_id));
    const price = v?.price ?? p.final_price;
    const quantity = Number(it.quantity || 1);
    return { id: idx + 1, product_id: p.id, variant_id: v?.id ?? null, name: p.name, variant: v?.name ?? null, image: p.image, price, quantity, total: price * quantity };
  });
  const qty = items.reduce((a, b) => a + b.quantity, 0);
  const subtotal = items.reduce((a, b) => a + b.total, 0);
  const area = (body.delivery_area as Order["delivery_area"]) || "inside_dhaka";
  const d = demoSettings.delivery;
  const delivery = body.delivery_charge !== undefined ? Number(body.delivery_charge) : qty >= d.free_delivery_min_qty ? 0 : area === "inside_dhaka" ? d.inside_dhaka : d.outside_dhaka;
  let discount = Number(body.discount || 0);
  if (body.coupon_code) {
    const c = db.coupons.find((x) => String(x.code).toUpperCase() === String(body.coupon_code).toUpperCase());
    if (c) discount = c.type === "percent" ? Math.min(Math.round((subtotal * Number(c.value)) / 100), Number(c.max_discount || Infinity)) : Number(c.value);
  }
  const id = Math.max(...db.orders.map((o) => o.id), 1000) + 1;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const order: Order = {
    id, number: `MRM-${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${String(id - 1000).padStart(4, "0")}`,
    status: "pending", status_label: STATUS_LABELS.pending, payment_method: "cod", payment_status: "unpaid",
    customer_name: String(body.customer_name || ""), phone: normalizePhone(String(body.phone || "")), address: String(body.address || ""),
    district: (body.district as string) || null, delivery_area: area, note: (body.note as string) || null,
    subtotal, delivery_charge: delivery, discount, advance_paid: Number(body.advance_paid || 0),
    total: subtotal + delivery - discount - Number(body.advance_paid || 0),
    coupon_code: (body.coupon_code as string) || null, source, courier: null, consignment_id: null, tracking_code: null, courier_status: null,
    items, history: [{ status: "pending", note: "Order placed", created_at: now.toISOString() }], created_at: now.toISOString(),
  };
  return order;
}

function genericCrud(name: keyof typeof db, method: string, id: number | null, body: AnyRec, query: Query) {
  const list = db[name] as AnyRec[];
  if (method === "GET" && id === null) {
    let items = list;
    if (query.search) items = items.filter((x) => JSON.stringify(x).toLowerCase().includes(String(query.search).toLowerCase()));
    return paginate(items, query, 50);
  }
  if (method === "POST" && id === null) {
    const rec = { ...body, id: nextId(list) };
    list.unshift(rec);
    return { data: rec };
  }
  const idx = list.findIndex((x) => Number(x.id) === id);
  if (idx < 0) notFound();
  if (method === "GET") return { data: list[idx] };
  if (method === "PUT" || method === "PATCH") { list[idx] = { ...list[idx], ...body, id: id! }; return { data: list[idx] }; }
  if (method === "DELETE") { list.splice(idx, 1); return { message: "Deleted" }; }
  notFound();
}

function fraudFor(phone: string) {
  const p = normalizePhone(phone);
  const seed = Number(p.slice(-3)) || 7;
  const couriers = ["Steadfast", "Pathao", "RedX"].map((name, i) => {
    const total = (seed * (i + 3)) % 14;
    const cancelled = Math.round(total * (((seed + i) % 5) / 10));
    return { name, total, delivered: total - cancelled, cancelled };
  });
  const total = couriers.reduce((a, b) => a + b.total, 0);
  const delivered = couriers.reduce((a, b) => a + b.delivered, 0);
  const local = db.orders.filter((o) => o.phone === p);
  const rate = total ? Math.round((delivered / total) * 100) : 0;
  return {
    phone: p, total, delivered, cancelled: total - delivered, success_rate: rate,
    risk: (total === 0 ? "medium" : rate >= 80 ? "low" : rate >= 50 ? "medium" : "high") as "low" | "medium" | "high",
    couriers,
    local: { orders: local.length, delivered: local.filter((o) => o.status === "delivered").length, cancelled: local.filter((o) => o.status === "cancelled").length, returned: local.filter((o) => o.status === "returned").length },
    blacklisted: db.blacklist.has(p),
  };
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export async function demoRequest<T>(method: string, rawPath: string, query: Query, rawBody: unknown, token: string | null | undefined): Promise<T> {
  if (typeof window !== "undefined") await sleep(120);
  const path = rawPath.split("?")[0].replace(/\/$/, "");
  const body: AnyRec = rawBody instanceof FormData ? {} : ((rawBody as AnyRec) ?? {});
  const seg = path.split("/").filter(Boolean);
  const r = (x: unknown) => structuredClone(x) as T;

  // ---------- public ----------
  if (path === "/settings") return r(demoSettings);
  if (path === "/home") {
    const active = db.products.filter((p) => p.status === "active");
    return r({
      banners: db.banners.filter((b) => b.is_active !== false),
      categories: db.categories,
      sections: [
        { title: "টপ সেলিং", slug: "best-sellers", products: [...active].sort((a, b) => b.reviews_count - a.reviews_count).slice(0, 10).map(demoCard) },
        { title: "নতুন এসেছে", slug: "new-arrivals", products: [...active].reverse().slice(0, 10).map(demoCard) },
        { title: "আজকের ডিল", slug: "deals", products: [...active].sort((a, b) => b.discount_percent - a.discount_percent).slice(0, 10).map(demoCard) },
      ],
    });
  }
  if (path === "/categories") return r({ data: db.categories });
  if (seg[0] === "categories" && seg[1]) {
    const c = db.categories.find((x) => x.slug === seg[1]);
    if (!c) notFound();
    return r({ data: c });
  }
  if (path === "/products") {
    let items = db.products.filter((p) => p.status === "active");
    if (query.category) items = items.filter((p) => p.category?.slug === query.category);
    if (query.search) { const s = String(query.search).toLowerCase(); items = items.filter((p) => p.name.toLowerCase().includes(s) || p.slug.includes(s) || (p.short_description ?? "").includes(s)); }
    if (query.min_price) items = items.filter((p) => p.final_price >= Number(query.min_price));
    if (query.max_price) items = items.filter((p) => p.final_price <= Number(query.max_price));
    const sort = String(query.sort || "latest");
    items = [...items].sort((a, b) => sort === "price_asc" ? a.final_price - b.final_price : sort === "price_desc" ? b.final_price - a.final_price : sort === "popular" ? b.reviews_count - a.reviews_count : b.id - a.id);
    return r(paginate(items.map(demoCard), query, 12));
  }
  if (seg[0] === "products" && seg[1] && !seg[2]) {
    const p = db.products.find((x) => x.slug === seg[1]);
    if (!p) notFound();
    const related = db.products.filter((x) => x.id !== p.id && x.category_id === p.category_id).concat(db.products.filter((x) => x.category_id !== p.category_id)).slice(0, 8).map(demoCard);
    return r({ data: { ...p, related } });
  }
  if (seg[0] === "products" && seg[2] === "reviews") {
    const p = db.products.find((x) => x.slug === seg[1]);
    if (!p) notFound();
    if (method === "POST") return r({ data: { id: Date.now(), ...body, created_at: new Date().toISOString() } });
    return r(paginate(db.reviews.filter((x) => (x.product as { id: number })?.id === p.id && x.is_approved), query, 10));
  }
  if (seg[0] === "landing-pages" && seg[1]) {
    const lp = db["landing-pages"].find((x) => x.slug === seg[1]);
    if (!lp) notFound();
    return r({ data: lp });
  }
  if (seg[0] === "pages" && seg[1]) {
    const pg = db.pages.find((x) => x.slug === seg[1]);
    if (!pg) notFound();
    return r({ data: pg });
  }
  if (path === "/coupons/validate") {
    const c = db.coupons.find((x) => String(x.code).toUpperCase() === String(body.code || "").toUpperCase() && x.is_active);
    if (!c) throw new ApiError("কুপন কোডটি সঠিক নয়", 422, { code: ["কুপন কোডটি সঠিক নয়"] });
    const sub = Number(body.subtotal || 0);
    if (sub < Number(c.min_order)) throw new ApiError(`কমপক্ষে ৳${c.min_order} অর্ডারে এই কুপন প্রযোজ্য`, 422, { code: [`কমপক্ষে ৳${c.min_order} অর্ডারে এই কুপন প্রযোজ্য`] });
    const discount = c.type === "percent" ? Math.min(Math.round((sub * Number(c.value)) / 100), Number(c.max_discount || Infinity)) : Number(c.value);
    return r({ data: { code: c.code, type: c.type, value: c.value, discount } });
  }
  if (path === "/checkout/draft") {
    const existing = db.incomplete.find((x) => x.phone === normalizePhone(String(body.phone)));
    const rec = { id: existing?.id ?? db.incomplete.length + 100, name: (body.name as string) ?? null, phone: normalizePhone(String(body.phone)), address: (body.address as string) ?? null, items: (body.items as never[]) ?? [], created_at: new Date().toISOString() };
    if (existing) Object.assign(existing, rec); else db.incomplete.unshift(rec);
    return r({ data: { id: rec.id } });
  }
  if (path === "/orders" && method === "POST") {
    const phone = normalizePhone(String(body.phone || ""));
    if (!BD_PHONE_RE.test(phone)) throw new ApiError("সঠিক মোবাইল নম্বর দিন", 422, { phone: ["সঠিক মোবাইল নম্বর দিন"] });
    if (db.blacklist.has(phone)) throw new ApiError("এই নম্বর থেকে অর্ডার গ্রহণ করা যাচ্ছে না", 422, { phone: ["এই নম্বর থেকে অর্ডার গ্রহণ করা যাচ্ছে না"] });
    const o = makeOrder(body, (body.source as string) || "web");
    db.orders.unshift(o);
    if (body.draft_id) db.incomplete = db.incomplete.filter((x) => x.id !== Number(body.draft_id));
    return r({ data: o });
  }
  if (path === "/orders/track") {
    const o = db.orders.find((x) => x.number.toUpperCase() === String(query.number || "").toUpperCase().trim() && x.phone === normalizePhone(String(query.phone || "")));
    if (!o) throw new ApiError("এই নম্বর ও ফোন দিয়ে কোনো অর্ডার পাওয়া যায়নি", 404);
    return r({ data: o });
  }

  // ---------- auth ----------
  if (path === "/auth/login") {
    const login = String(body.login || "").trim().toLowerCase();
    if (login === "admin@mrmzone.shop" && body.password === "demo") return r({ token: "demo-admin-token", user: DEMO_ADMIN });
    if (body.password && String(body.password).length >= 4) return r({ token: "demo-customer-token", user: { ...DEMO_CUSTOMER, phone: login.includes("@") ? DEMO_CUSTOMER.phone : login } });
    throw new ApiError("ফোন/ইমেইল বা পাসওয়ার্ড সঠিক নয়", 422, { login: ["ফোন/ইমেইল বা পাসওয়ার্ড সঠিক নয়"] });
  }
  if (path === "/auth/register") return r({ token: "demo-customer-token", user: { ...DEMO_CUSTOMER, name: body.name, phone: body.phone, email: body.email ?? null } });
  if (path === "/auth/logout") return r({ message: "ok" });
  if (path === "/me") {
    requireAuth(token);
    return r({ data: token === "demo-admin-token" ? DEMO_ADMIN : DEMO_CUSTOMER });
  }
  if (path === "/me/orders") { requireAuth(token); return r(paginate(db.orders.slice(0, 3), query, 10)); }
  if (seg[0] === "me" && seg[1] === "wishlist") { requireAuth(token); return r({ data: db.products.slice(0, 3).map(demoCard) }); }

  // ---------- admin ----------
  if (seg[0] !== "admin") notFound();
  requireAuth(token);
  const area = seg[1];
  const id = seg[2] && /^\d+$/.test(seg[2]) ? Number(seg[2]) : null;

  if (area === "dashboard") {
    const orders = db.orders.filter((o) => inRange(o.created_at, query));
    const count = (s: OrderStatus) => orders.filter((o) => o.status === s).length;
    const delivered = orders.filter((o) => o.status === "delivered");
    const revenue = delivered.reduce((a, b) => a + b.total, 0);
    const cogs = delivered.reduce((a, o) => a + o.items.reduce((x, it) => x + (db.products.find((p) => p.id === it.product_id)?.cost_price ?? 0) * it.quantity, 0), 0);
    const days = query.range === "today" ? 1 : query.range === "7d" ? 7 : 14;
    const sales_chart = Array.from({ length: days }, (_, i) => {
      const d = new Date(Date.now() - (days - 1 - i) * 86400000);
      const dayOrders = db.orders.filter((o) => new Date(o.created_at).toDateString() === d.toDateString());
      return { date: d.toISOString().slice(0, 10), orders: dayOrders.length, revenue: dayOrders.reduce((a, b) => a + b.total, 0) };
    });
    const tops = new Map<number, { id: number; name: string; qty: number; revenue: number }>();
    orders.forEach((o) => o.items.forEach((it) => { const t = tops.get(it.product_id) ?? { id: it.product_id, name: it.name, qty: 0, revenue: 0 }; t.qty += it.quantity; t.revenue += it.total; tops.set(it.product_id, t); }));
    return r({
      cards: { total_orders: orders.length, pending: count("pending"), confirmed: count("confirmed"), shipped: count("shipped"), delivered: count("delivered"), cancelled: count("cancelled"), returned: count("returned"), revenue, profit: revenue - cogs, incomplete: db.incomplete.length },
      sales_chart,
      status_breakdown: (Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => ({ status: s, count: count(s) })).filter((x) => x.count > 0),
      top_products: [...tops.values()].sort((a, b) => b.qty - a.qty).slice(0, 5),
      low_stock: db.products.filter((p) => p.stock <= 5).map(demoCard),
      recent_orders: db.orders.slice(0, 6),
    });
  }

  if (area === "uploads") {
    let url = "";
    if (rawBody instanceof FormData) { const f = rawBody.get("file"); if (f instanceof File && typeof URL !== "undefined") url = URL.createObjectURL(f); }
    return r({ url, path: `uploads/demo-${Date.now()}` });
  }

  if (area === "products") {
    if (method === "GET" && id === null) {
      let items = db.products;
      if (query.search) items = items.filter((p) => p.name.includes(String(query.search)) || (p.sku ?? "").toLowerCase().includes(String(query.search).toLowerCase()));
      if (query.category_id) items = items.filter((p) => p.category_id === Number(query.category_id));
      if (query.status) items = items.filter((p) => p.status === query.status);
      if (query.stock === "low") items = items.filter((p) => p.stock <= 5);
      return r(paginate(items, query, 20));
    }
    if (method === "POST" && id === null) {
      const cat = db.categories.find((c) => c.id === Number(body.category_id));
      const price = Number(body.price || 0); const sale = body.sale_price ? Number(body.sale_price) : null;
      const p = { ...(body as object), id: nextId(db.products as unknown as AnyRec[]), final_price: sale ?? price, discount_percent: sale ? Math.round(((price - sale) / price) * 100) : 0, in_stock: Number(body.stock || 0) > 0, rating: 0, reviews_count: 0, related: [], category: cat ? { id: cat.id, name: cat.name, slug: cat.slug } : null } as unknown as AdminProduct;
      db.products.unshift(p);
      return r({ data: p });
    }
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx < 0) notFound();
    if (method === "GET") return r({ data: db.products[idx] });
    if (method === "PUT") { db.products[idx] = { ...db.products[idx], ...(body as object) } as AdminProduct; return r({ data: db.products[idx] }); }
    if (method === "DELETE") { db.products.splice(idx, 1); return r({ message: "Deleted" }); }
  }

  if (area === "orders") {
    if (seg[2] === "bulk-status") { const ids = (body.ids as number[]) || []; db.orders.forEach((o) => { if (ids.includes(o.id)) { o.status = body.status as OrderStatus; o.status_label = STATUS_LABELS[o.status]; o.history.push({ status: o.status, note: "Bulk update", created_at: new Date().toISOString() }); } }); return r({ message: "Updated" }); }
    if (seg[2] === "bulk-courier") { const ids = (body.ids as number[]) || []; db.orders.forEach((o) => { if (ids.includes(o.id)) { o.courier = body.courier as Order["courier"]; o.consignment_id = String(9900000 + o.id); o.tracking_code = `${String(body.courier).slice(0, 2).toUpperCase()}${o.id}`; o.courier_status = "in_review"; o.status = "shipped"; o.status_label = STATUS_LABELS.shipped; } }); return r({ message: "Sent" }); }
    if (method === "GET" && id === null) {
      let items = db.orders.filter((o) => inRange(o.created_at, query));
      if (query.search) { const s = String(query.search).toLowerCase(); items = items.filter((o) => o.number.toLowerCase().includes(s) || o.phone.includes(s) || o.customer_name.toLowerCase().includes(s)); }
      if (query.courier) items = items.filter((o) => o.courier === query.courier);
      if (query.source) items = items.filter((o) => o.source === query.source);
      const counts: Record<string, number> = { all: items.length };
      for (const s of Object.keys(STATUS_LABELS)) counts[s] = items.filter((o) => o.status === s).length;
      if (query.status) items = items.filter((o) => o.status === query.status);
      const page = paginate(items, query, 20);
      return r({ ...page, meta: { ...page.meta, counts } });
    }
    if (method === "POST" && id === null) { const o = makeOrder(body, String(body.source || "manual")); if (body.status) { o.status = body.status as OrderStatus; o.status_label = STATUS_LABELS[o.status]; } db.orders.unshift(o); return r({ data: o }); }
    const o = db.orders.find((x) => x.id === id);
    if (!o) notFound();
    if (seg[3] === "status") { o.status = body.status as OrderStatus; o.status_label = STATUS_LABELS[o.status]; o.history.push({ status: o.status, note: (body.note as string) || null, created_at: new Date().toISOString() }); return r({ data: o }); }
    if (seg[3] === "courier" && seg[4] === "refresh") { o.courier_status = o.status === "delivered" ? "delivered" : "pending"; return r({ data: o }); }
    if (seg[3] === "courier") { o.courier = body.courier as Order["courier"]; o.consignment_id = String(9900000 + o.id); o.tracking_code = `${String(body.courier).slice(0, 2).toUpperCase()}${o.id}`; o.courier_status = "in_review"; o.status = "shipped"; o.status_label = STATUS_LABELS.shipped; o.history.push({ status: "shipped", note: `Sent to ${body.courier}`, created_at: new Date().toISOString() }); return r({ data: o }); }
    if (seg[3] === "invoice") return r({ data: o });
    if (method === "GET") return r({ data: o });
    if (method === "PUT") {
      Object.assign(o, body);
      if (Array.isArray(body.items)) {
        o.items = (body.items as AnyRec[]).map((it, i) => { const p = db.products.find((x) => x.id === Number(it.product_id)); const v = p?.variants.find((x) => x.id === Number(it.variant_id)); const price = Number(it.price ?? v?.price ?? p?.final_price ?? 0); const q = Number(it.quantity || 1); return { id: i + 1, product_id: Number(it.product_id), variant_id: v?.id ?? null, name: p?.name ?? String(it.name ?? ""), variant: v?.name ?? null, image: p?.image ?? null, price, quantity: q, total: price * q }; });
      }
      o.subtotal = o.items.reduce((a, b) => a + b.total, 0);
      o.total = o.subtotal + Number(o.delivery_charge) - Number(o.discount) - Number(o.advance_paid);
      o.status_label = STATUS_LABELS[o.status];
      return r({ data: o });
    }
  }

  if (area === "incomplete-orders") {
    if (method === "GET") return r(paginate(db.incomplete, query, 50));
    const rec = db.incomplete.find((x) => x.id === id);
    if (!rec) notFound();
    if (seg[3] === "convert") {
      const o = makeOrder({ customer_name: rec.name ?? "Customer", phone: rec.phone, address: rec.address ?? "", items: rec.items, delivery_area: "inside_dhaka" }, "web");
      db.orders.unshift(o); db.incomplete = db.incomplete.filter((x) => x.id !== id);
      return r({ data: o });
    }
    db.incomplete = db.incomplete.filter((x) => x.id !== id);
    return r({ message: "Deleted" });
  }

  if (area === "courier" && seg[2] === "balance") return r({ data: { steadfast: 12450, pathao: 0, redx: 0 } });
  if (area === "fraud-check") return r({ data: fraudFor(String(query.phone || "")) });

  if (area === "customers") {
    const map = new Map<string, { name: string; phone: string; orders_count: number; total_spent: number; last_order_at: string | null; blacklisted: boolean }>();
    for (const o of db.orders) {
      const c = map.get(o.phone) ?? { name: o.customer_name, phone: o.phone, orders_count: 0, total_spent: 0, last_order_at: null, blacklisted: db.blacklist.has(o.phone) };
      c.orders_count++; if (o.status === "delivered") c.total_spent += o.total;
      if (!c.last_order_at || o.created_at > c.last_order_at) c.last_order_at = o.created_at;
      map.set(o.phone, c);
    }
    let items = [...map.values()];
    if (query.search) items = items.filter((c) => c.phone.includes(String(query.search)) || c.name.includes(String(query.search)));
    return r(paginate(items, query, 20));
  }
  if (area === "blacklist") {
    if (method === "POST") { db.blacklist.add(normalizePhone(String(body.phone))); return r({ message: "Blacklisted" }); }
    if (method === "DELETE" && seg[2]) { db.blacklist.delete(seg[2]); return r({ message: "Removed" }); }
  }

  if (area === "purchases" && method === "POST") {
    const items = (body.items as AnyRec[]) || [];
    items.forEach((it) => { const p = db.products.find((x) => x.id === Number(it.product_id)); if (p) { p.stock += Number(it.quantity); p.in_stock = p.stock > 0; } });
    const total = items.reduce((a, it) => a + Number(it.quantity) * Number(it.unit_cost), 0);
    const sup = db.suppliers.find((s) => s.id === Number(body.supplier_id));
    const rec = { ...body, id: nextId(db.purchases), total, supplier: sup ? { id: sup.id, name: sup.name } : null };
    db.purchases.unshift(rec);
    return r({ data: rec });
  }
  if (area === "stock-movements") {
    let items = demoMovements;
    if (query.product_id) items = items.filter((m) => m.product_id === Number(query.product_id));
    return r(paginate(items, query, 50));
  }

  if (area === "reports") {
    const orders = db.orders.filter((o) => inRange(o.created_at, query));
    const delivered = orders.filter((o) => o.status === "delivered");
    const revenue = delivered.reduce((a, b) => a + b.subtotal - b.discount, 0);
    const cogs = delivered.reduce((a, o) => a + o.items.reduce((x, it) => x + (db.products.find((p) => p.id === it.product_id)?.cost_price ?? 0) * it.quantity, 0), 0);
    const expenses = (db.expenses as unknown as { amount: number; date: string }[]).filter((e) => inRange(e.date, query)).reduce((a, b) => a + Number(b.amount), 0);
    if (seg[2] === "products") {
      const m = new Map<number, { id: number; name: string; qty: number; revenue: number; cost: number; profit: number }>();
      delivered.forEach((o) => o.items.forEach((it) => { const cost = (db.products.find((p) => p.id === it.product_id)?.cost_price ?? 0) * it.quantity; const row = m.get(it.product_id) ?? { id: it.product_id, name: it.name, qty: 0, revenue: 0, cost: 0, profit: 0 }; row.qty += it.quantity; row.revenue += it.total; row.cost += cost; row.profit = row.revenue - row.cost; m.set(it.product_id, row); }));
      return r({ data: [...m.values()].sort((a, b) => b.revenue - a.revenue) });
    }
    const days = 14;
    const by_day = Array.from({ length: days }, (_, i) => {
      const d = new Date(Date.now() - (days - 1 - i) * 86400000);
      const dd = delivered.filter((o) => new Date(o.created_at).toDateString() === d.toDateString());
      return { date: d.toISOString().slice(0, 10), revenue: dd.reduce((a, b) => a + b.total, 0), orders: dd.length };
    });
    return r({ revenue, cogs, gross_profit: revenue - cogs, expenses, net_profit: revenue - cogs - expenses, delivery_charges: delivered.reduce((a, b) => a + b.delivery_charge, 0), orders: orders.length, delivered: delivered.length, returned: orders.filter((o) => o.status === "returned").length, by_day });
  }

  if (area === "sms") {
    if (seg[2] === "send") { const phones = (body.phones as string[]) || []; phones.forEach((p) => db.smsLogs.unshift({ id: db.smsLogs.length + 1, phone: p, message: String(body.message), status: "sent", created_at: new Date().toISOString() })); return r({ message: `Sent to ${phones.length}` }); }
    return r(paginate(db.smsLogs, query, 50));
  }
  if (area === "settings") {
    if (method === "PUT") db.settings = { ...db.settings, ...(body as object) };
    return r({ data: db.settings });
  }
  if (area === "activity-logs") return r(paginate([{ id: 1, user: "MRM Admin", action: "Order status changed", created_at: new Date().toISOString() }], query));

  if (area === "reviews" && method === "GET" && id === null) return r(paginate(db.reviews, query, 50));

  const crudMap: Record<string, keyof typeof db> = {
    categories: "categories", brands: "brands", banners: "banners", coupons: "coupons", "landing-pages": "landing-pages",
    pages: "pages", reviews: "reviews", suppliers: "suppliers", purchases: "purchases", expenses: "expenses", staff: "staff",
  };
  if (crudMap[area]) {
    if (area === "landing-pages" && (method === "POST" || method === "PUT") && body.product_id) {
      const p = db.products.find((x) => x.id === Number(body.product_id));
      if (p) body.product = { ...p, related: [] };
    }
    return r(genericCrud(crudMap[area], method, id, body, query));
  }
  notFound();
}
