# MRM Zone Shop — API Contract (v1)

Base URL: `{API_URL}/api/v1` (e.g. `https://api.mrmzone.shop/api/v1`)
All responses are JSON. Money is in BDT as integers (taka, no paisa).
Lists are paginated Laravel-style:

```json
{ "data": [...], "meta": { "current_page": 1, "last_page": 4, "per_page": 20, "total": 73 } }
```

Single resources: `{ "data": {...} }`. Errors: `{ "message": "...", "errors": { "field": ["msg"] } }` with HTTP 422/401/403/404.

Auth uses **Laravel Sanctum bearer tokens** (same for website, admin panel and future Android/iOS apps):
`Authorization: Bearer <token>`.

---

## Shared resource shapes

### Category
```json
{ "id": 1, "name": "ফ্যাশন", "slug": "fashion", "icon": "shirt", "image": "https://.../c.jpg",
  "parent_id": null, "products_count": 12, "children": [] }
```
`icon` is one of: shirt, bag, watch, headphones, home, snowflake, gift, sparkles, baby, bike, store, tag.

### ProductCard (lists)
```json
{ "id": 10, "name": "ফ্লিস হুডি", "slug": "fleece-hoodie", "image": "https://.../1.jpg",
  "price": 890, "sale_price": 790, "final_price": 790, "discount_percent": 11,
  "in_stock": true, "rating": 4.6, "reviews_count": 8, "badge": "Best Seller",
  "category": { "id": 1, "name": "ফ্যাশন", "slug": "fashion" } }
```

### Product (detail) = ProductCard + 
```json
{ "sku": "HD-001", "short_description": "...", "description": "<p>HTML</p>",
  "images": ["https://.../1.jpg", "https://.../2.jpg"], "stock": 25,
  "variants": [ { "id": 3, "name": "কালো / L", "attributes": { "color": "কালো", "size": "L" },
                  "price": 790, "stock": 5, "sku": "HD-001-BK-L" } ],
  "options": { "color": ["কালো","অ্যাশ"], "size": ["M","L","XL"] },
  "size_chart": "<table>..</table>" , "video_url": null,
  "meta_title": "...", "meta_description": "...",
  "related": [ProductCard, ...] }
```

### Order
```json
{ "id": 5, "number": "MRM-261027-0005", "status": "pending", "status_label": "নতুন",
  "payment_method": "cod", "payment_status": "unpaid",
  "customer_name": "রহিম", "phone": "01712345678", "address": "…", "district": "Dhaka",
  "delivery_area": "inside_dhaka", "note": null,
  "subtotal": 1580, "delivery_charge": 0, "discount": 0, "advance_paid": 0, "total": 1580,
  "coupon_code": null, "source": "web",
  "courier": "steadfast", "consignment_id": "12345", "tracking_code": "SF123", "courier_status": "in_review",
  "items": [ { "id": 1, "product_id": 10, "variant_id": 3, "name": "ফ্লিস হুডি", "variant": "কালো / L",
               "image": "https://...", "price": 790, "quantity": 2, "total": 1580 } ],
  "history": [ { "status": "pending", "note": "Order placed", "created_at": "2026-10-27T10:00:00Z" } ],
  "created_at": "2026-10-27T10:00:00Z" }
```

Order statuses: `pending` (নতুন), `confirmed` (কনফার্মড), `processing` (প্রসেসিং), `shipped` (কুরিয়ারে),
`delivered` (ডেলিভারড), `partial` (আংশিক ডেলিভারি), `cancelled` (বাতিল), `returned` (ফেরত), `on_hold` (হোল্ড).

---

## Public storefront endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/settings` | Store info: `{ name, logo, phone, whatsapp, email, address, facebook, delivery: { inside_dhaka: 70, outside_dhaka: 130, free_delivery_min_qty: 2 }, payment_methods: ["cod","bkash"], announcement, meta_pixel_id, gtm_id }` |
| GET | `/home` | `{ banners: [{id,title,subtitle,image,link,button_text}], categories: [Category], sections: [{ title, slug, products: [ProductCard] }] }` sections: `new-arrivals`, `best-sellers`, `deals` |
| GET | `/categories` | `{ data: [Category with children] }` |
| GET | `/categories/{slug}` | `{ data: Category }` |
| GET | `/products` | query: `category` (slug), `search`, `sort` (`latest`,`price_asc`,`price_desc`,`popular`), `min_price`, `max_price`, `page`, `per_page` → paginated ProductCard |
| GET | `/products/{slug}` | `{ data: Product }` |
| GET | `/products/{slug}/reviews` | paginated `{ id, name, rating, comment, created_at }` |
| POST | `/products/{slug}/reviews` | `{ name, rating, comment }` (auth optional; stored unapproved) |
| GET | `/landing-pages/{slug}` | `{ data: { title, slug, headline, subheadline, hero_image, video_url, sections: [{type:'features'|'text'|'faq'|'gallery', title, items:[...]}], product: Product, offer_text, theme_color } }` |
| GET | `/pages/{slug}` | CMS page `{ title, slug, content }` (terms, privacy, return-policy, delivery-policy, about) |
| POST | `/coupons/validate` | body `{ code, subtotal }` → `{ data: { code, type, value, discount } }` or 422 |
| POST | `/checkout/draft` | Save incomplete order (abandoned checkout). body `{ name?, phone, address?, items: [{product_id, variant_id?, quantity}] }` → `{ data: { id } }` |
| POST | `/orders` | Checkout. body `{ customer_name, phone, address, district?, delivery_area: 'inside_dhaka'|'outside_dhaka', note?, coupon_code?, payment_method: 'cod', items: [{product_id, variant_id?, quantity}], draft_id?, utm_source?, utm_campaign? }` → `201 { data: Order }`. Phone must match `^01[3-9]\d{8}$`. Blacklisted phones get 422. |
| GET | `/orders/track` | query `number`, `phone` → `{ data: Order }` |

## Customer auth (website + mobile apps)

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | `{ name, phone, email?, password }` → `{ token, user }` |
| POST | `/auth/login` | `{ login (phone or email), password, device_name? }` → `{ token, user }` |
| POST | `/auth/logout` | auth |
| GET | `/me` | auth → `{ data: { id, name, phone, email, role, addresses } }` |
| PUT | `/me` | update profile |
| GET | `/me/orders` | auth → paginated Order |
| GET/POST/DELETE | `/me/wishlist`, `/me/wishlist/{product_id}` | auth |

`user.role`: `customer`, `admin`, `manager`, `staff`. Admin panel requires role ≠ customer.

---

## Admin endpoints (`/admin/*`, bearer token, staff roles)

| Area | Endpoints |
|---|---|
| Dashboard | `GET /admin/dashboard?range=today|7d|30d|month` → `{ cards: { total_orders, pending, confirmed, shipped, delivered, cancelled, returned, revenue, profit, incomplete }, sales_chart: [{date, orders, revenue}], status_breakdown: [{status, count}], top_products: [{id,name,qty,revenue}], low_stock: [ProductCard+stock], recent_orders: [Order] }` |
| Products | `GET /admin/products?search=&category_id=&status=&stock=low` · `POST /admin/products` · `GET/PUT/DELETE /admin/products/{id}` · `POST /admin/uploads` (multipart `file` → `{ url, path }`). Product admin fields add: `cost_price, status ('active'|'draft'), is_featured, badge, category_id, brand_id, variants[]` |
| Categories | `GET/POST /admin/categories`, `PUT/DELETE /admin/categories/{id}` |
| Brands | `GET/POST /admin/brands`, `PUT/DELETE /admin/brands/{id}` |
| Banners | `GET/POST /admin/banners`, `PUT/DELETE /admin/banners/{id}` |
| Orders | `GET /admin/orders?status=&search=&courier=&from=&to=&source=` (paginated Order + `counts` per status in `meta.counts`) · `GET /admin/orders/{id}` · `PUT /admin/orders/{id}` (edit customer/items/charges) · `POST /admin/orders/{id}/status` `{ status, note? }` · `POST /admin/orders` (manual / POS order, `source: 'manual'|'pos'|'facebook'`) · `POST /admin/orders/bulk-status` `{ ids, status }` · `GET /admin/orders/{id}/invoice` (printable data) |
| Incomplete | `GET /admin/incomplete-orders` · `POST /admin/incomplete-orders/{id}/convert` · `DELETE /admin/incomplete-orders/{id}` |
| Courier | `POST /admin/orders/{id}/courier` `{ courier: 'steadfast'|'pathao'|'redx', note?, weight? }` → books parcel, returns Order with `consignment_id/tracking_code` · `POST /admin/orders/bulk-courier` `{ ids, courier }` · `POST /admin/orders/{id}/courier/refresh` → updates `courier_status` · `GET /admin/courier/balance` |
| Fraud check | `GET /admin/fraud-check?phone=017...` → `{ data: { phone, total, delivered, cancelled, success_rate, risk: 'low'|'medium'|'high', couriers: [{name, total, delivered, cancelled}], local: { orders, delivered, cancelled, returned }, blacklisted } }` |
| Customers | `GET /admin/customers?search=` (aggregated by phone: name, phone, orders_count, total_spent, last_order_at, blacklisted) · `POST /admin/blacklist` `{ phone, reason }` · `DELETE /admin/blacklist/{phone}` |
| Coupons | `GET/POST /admin/coupons`, `PUT/DELETE /admin/coupons/{id}` fields `{ code, type: 'percent'|'fixed', value, min_order, max_discount?, usage_limit?, used, starts_at?, ends_at?, is_active }` |
| Landing pages | `GET/POST /admin/landing-pages`, `PUT/DELETE /admin/landing-pages/{id}` |
| CMS pages | `GET/POST /admin/pages`, `PUT/DELETE /admin/pages/{id}` |
| Reviews | `GET /admin/reviews`, `PUT /admin/reviews/{id}` `{ is_approved }`, `DELETE` |
| Inventory / Purchases | `GET/POST /admin/suppliers`, `PUT/DELETE /admin/suppliers/{id}` · `GET/POST /admin/purchases` (`{ supplier_id, date, items: [{product_id, variant_id?, quantity, unit_cost}], paid, note }` → increases stock) · `GET /admin/stock-movements?product_id=` |
| Accounting | `GET/POST /admin/expenses`, `PUT/DELETE /admin/expenses/{id}` (`{ category, amount, date, note }`) · `GET /admin/reports/summary?from=&to=` → `{ revenue, cogs, gross_profit, expenses, net_profit, delivery_charges, orders, delivered, returned, by_day:[...] }` · `GET /admin/reports/products?from=&to=` |
| SMS | `POST /admin/sms/send` `{ phones: [], message }` · `GET /admin/sms/logs` · auto SMS on order placed/confirmed/shipped (configurable) |
| Settings | `GET /admin/settings` · `PUT /admin/settings` (store info, delivery charges, courier API keys, SMS gateway, pixel/GTM, auto-SMS templates) |
| Staff | `GET/POST /admin/staff`, `PUT/DELETE /admin/staff/{id}` (`{ name, email, phone, password?, role }`) |
| Activity | `GET /admin/activity-logs` |

Role permissions: `admin` everything; `manager` everything except staff & settings; `staff` orders, incomplete orders, customers, fraud check, POS.

---

## Notes from integration (implemented)

- `ProductCard` also includes `has_variants` (boolean) — cards send color/size products to the product page instead of adding straight to cart.
- Banners: `position` is `slider` (main hero slider) or `side` (right-side banners); plus `sort_order`, `is_active`.
- `GET /admin/orders/{id}/invoice` → `{ data: Order, store: { name, phone, address, email, logo, website } }`.
- `GET/PUT /admin/settings` uses a nested shape:
  `{ store: {name, tagline, phone, whatsapp, email, address, facebook, logo, announcement}, delivery: {inside_dhaka, outside_dhaka, free_delivery_min_qty}, courier: {default, steadfast: {api_key, secret_key}, pathao: {base_url, client_id, client_secret, username, password, store_id}, redx: {token, default_area_id}}, sms: {provider: 'log'|'bulksmsbd', api_key, sender_id}, tracking: {meta_pixel_id, gtm_id}, fraud: {api_key, api_url}, sms_templates: {order_placed, order_confirmed, order_shipped, enabled: {order_placed, order_confirmed, order_shipped}}, inventory: {low_stock_threshold} }`.
  PUT accepts any subset of it.
- Admin single-order endpoints (`GET/PUT /admin/orders/{id}`, `/status`, `/courier`, `/courier/refresh`) all return `{ data: Order }`.
