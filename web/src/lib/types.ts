// Types mirroring docs/API.md (v1). Money values are integer BDT.

export interface Paginated<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    counts?: Record<string, number>;
  };
}

export interface Single<T> {
  data: T;
}

export type CategoryIcon =
  | "shirt" | "bag" | "watch" | "headphones" | "home" | "snowflake"
  | "gift" | "sparkles" | "baby" | "bike" | "store" | "tag";

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: CategoryIcon | string | null;
  image: string | null;
  parent_id: number | null;
  products_count?: number;
  children?: Category[];
  // admin-only extras (optional)
  sort_order?: number;
  is_active?: boolean;
}

export interface CategoryRef {
  id: number;
  name: string;
  slug: string;
}

export interface ProductCard {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  sale_price: number | null;
  final_price: number;
  discount_percent: number;
  in_stock: boolean;
  rating: number;
  reviews_count: number;
  badge: string | null;
  category: CategoryRef | null;
  stock?: number;
  /** optional (not in API.md): lets cards send variant products to the product page without an extra request */
  has_variants?: boolean;
}

export interface ProductVariant {
  id: number;
  name: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  sku: string | null;
}

export interface Product extends ProductCard {
  sku: string | null;
  short_description: string | null;
  description: string | null;
  images: string[];
  stock: number;
  variants: ProductVariant[];
  options: Record<string, string[]>;
  size_chart: string | null;
  video_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  related: ProductCard[];
}

/** Admin product shape = Product + admin fields */
export interface AdminProduct extends Product {
  cost_price: number | null;
  status: "active" | "draft";
  is_featured: boolean;
  category_id: number | null;
  brand_id: number | null;
}

export type OrderStatus =
  | "pending" | "confirmed" | "processing" | "shipped" | "delivered"
  | "partial" | "cancelled" | "returned" | "on_hold";

export type DeliveryArea = "inside_dhaka" | "outside_dhaka";
export type Courier = "steadfast" | "pathao" | "redx";

export interface OrderItem {
  id?: number;
  product_id: number;
  variant_id: number | null;
  name: string;
  variant: string | null;
  image: string | null;
  price: number;
  quantity: number;
  total: number;
}

export interface OrderHistory {
  status: OrderStatus | string;
  note: string | null;
  created_at: string;
  user?: string | null;
}

export interface Order {
  id: number;
  number: string;
  status: OrderStatus;
  status_label: string;
  payment_method: string;
  payment_status: string;
  customer_name: string;
  phone: string;
  address: string;
  district: string | null;
  delivery_area: DeliveryArea;
  note: string | null;
  subtotal: number;
  delivery_charge: number;
  discount: number;
  advance_paid: number;
  total: number;
  coupon_code: string | null;
  source: string;
  courier: Courier | null;
  consignment_id: string | null;
  tracking_code: string | null;
  courier_status: string | null;
  items: OrderItem[];
  history: OrderHistory[];
  created_at: string;
  // optional admin extras
  admin_note?: string | null;
  assigned_to?: number | null;
}

export interface StoreSettings {
  name: string;
  logo: string | null;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  facebook: string;
  delivery: { inside_dhaka: number; outside_dhaka: number; free_delivery_min_qty: number };
  payment_methods: string[];
  announcement: string | null;
  meta_pixel_id: string | null;
  gtm_id: string | null;
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  image: string | null;
  link: string | null;
  button_text: string | null;
  // admin extras
  position?: "slider" | "side" | string;
  sort_order?: number;
  is_active?: boolean;
}

export interface HomeSection {
  title: string;
  slug: string;
  products: ProductCard[];
}

export interface HomeData {
  banners: Banner[];
  categories: Category[];
  sections: HomeSection[];
}

export interface Review {
  id: number;
  name: string;
  rating: number;
  comment: string;
  created_at: string;
  // admin extras
  is_approved?: boolean;
  product?: { id: number; name: string; slug: string } | null;
}

export type LandingSectionType = "features" | "text" | "faq" | "gallery";

export interface LandingSection {
  type: LandingSectionType;
  title: string;
  items: Array<string | { title?: string; text?: string; question?: string; answer?: string; image?: string }>;
}

export interface LandingPage {
  id?: number;
  title: string;
  slug: string;
  headline: string;
  subheadline: string | null;
  hero_image: string | null;
  video_url: string | null;
  sections: LandingSection[];
  product: Product;
  product_id?: number;
  offer_text: string | null;
  theme_color: string | null;
  is_active?: boolean;
}

export interface CmsPage {
  id?: number;
  title: string;
  slug: string;
  content: string;
  is_active?: boolean;
}

export interface Coupon {
  id: number;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_order: number;
  max_discount: number | null;
  usage_limit: number | null;
  used: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

export interface CouponResult {
  code: string;
  type: "percent" | "fixed";
  value: number;
  discount: number;
}

export interface User {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  role: "customer" | "admin" | "manager" | "staff";
  addresses?: Array<{ id?: number; address: string; district?: string | null }>;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface OrderItemInput {
  product_id: number;
  variant_id?: number | null;
  quantity: number;
}

export interface CheckoutBody {
  customer_name: string;
  phone: string;
  address: string;
  district?: string;
  delivery_area: DeliveryArea;
  note?: string;
  coupon_code?: string;
  payment_method: "cod";
  items: OrderItemInput[];
  draft_id?: number;
  utm_source?: string;
  utm_campaign?: string;
}

// ---------- Admin ----------

export interface DashboardData {
  cards: {
    total_orders: number; pending: number; confirmed: number; shipped: number;
    delivered: number; cancelled: number; returned: number; revenue: number;
    profit: number; incomplete: number;
  };
  sales_chart: Array<{ date: string; orders: number; revenue: number }>;
  status_breakdown: Array<{ status: OrderStatus | string; count: number }>;
  top_products: Array<{ id: number; name: string; qty: number; revenue: number }>;
  low_stock: ProductCard[];
  recent_orders: Order[];
}

export interface IncompleteOrder {
  id: number;
  name: string | null;
  phone: string;
  address: string | null;
  items: Array<{ product_id: number; variant_id?: number | null; quantity: number; name?: string; price?: number }>;
  total?: number;
  created_at: string;
}

export interface FraudCheck {
  phone: string;
  total: number;
  delivered: number;
  cancelled: number;
  success_rate: number;
  risk: "low" | "medium" | "high";
  couriers: Array<{ name: string; total: number; delivered: number; cancelled: number }>;
  local: { orders: number; delivered: number; cancelled: number; returned: number };
  blacklisted: boolean;
}

export interface Customer {
  name: string;
  phone: string;
  orders_count: number;
  total_spent: number;
  last_order_at: string | null;
  blacklisted: boolean;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  is_active?: boolean;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  balance?: number;
}

export interface Purchase {
  id: number;
  supplier_id: number;
  supplier?: { id: number; name: string } | null;
  date: string;
  items: Array<{ product_id: number; variant_id?: number | null; quantity: number; unit_cost: number; name?: string }>;
  total?: number;
  paid: number;
  note: string | null;
}

export interface StockMovement {
  id: number;
  product_id: number;
  product?: { id: number; name: string } | null;
  variant?: string | null;
  type: string;
  quantity: number;
  note: string | null;
  created_at: string;
}

export interface Expense {
  id: number;
  category: string;
  amount: number;
  date: string;
  note: string | null;
}

export interface ReportSummary {
  revenue: number;
  cogs: number;
  gross_profit: number;
  expenses: number;
  net_profit: number;
  delivery_charges: number;
  orders: number;
  delivered: number;
  returned: number;
  by_day: Array<{ date: string; revenue: number; orders?: number; profit?: number; expenses?: number }>;
}

export interface ProductReportRow {
  id: number;
  name: string;
  qty: number;
  revenue: number;
  cost?: number;
  profit?: number;
}

export interface SmsLog {
  id: number;
  phone: string;
  message: string;
  status: string;
  created_at: string;
}

export interface Staff {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "admin" | "manager" | "staff";
}

/** Admin settings: assumed to be a flat-ish object with grouped keys. */
export interface AdminSettings {
  store: { name: string; tagline?: string; phone: string; whatsapp: string; email: string; address: string; facebook: string; logo: string | null; announcement: string | null };
  delivery: { inside_dhaka: number; outside_dhaka: number; free_delivery_min_qty: number };
  courier: {
    default: "steadfast" | "pathao" | "redx";
    steadfast: { api_key: string; secret_key: string };
    pathao: { base_url: string; client_id: string; client_secret: string; username: string; password: string; store_id: string };
    redx: { token: string; default_area_id: string };
  };
  sms: { provider: string; api_key: string; sender_id: string };
  tracking: { meta_pixel_id: string; gtm_id: string };
  fraud: { api_key: string; api_url: string };
  sms_templates: { order_placed: string; order_confirmed: string; order_shipped: string; enabled: Record<string, boolean> };
}
