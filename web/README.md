# MRM Zone Shop — Web (Next.js)

Storefront (Bangla, mobile-first, COD) + admin panel for **mrmzone.shop**, coded against `../docs/API.md`.

- Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4
- Fonts: Hind Siliguri + Outfit, self-hosted in `src/fonts` via `next/font/local`
- Icons: lucide-react · Charts: recharts

## Quick start

```bash
cp .env.example .env.local      # set NEXT_PUBLIC_API_URL to the Laravel API (…/api/v1)
npm install
npm run dev                     # http://localhost:3000
```

### Demo mode (no backend needed)

```bash
NEXT_PUBLIC_DEMO_MODE=true npm run dev
```

Uses `src/lib/demo-data.ts` + `src/lib/demo-api.ts` (in-memory mock of API.md).
Admin: http://localhost:3000/admin/login — `admin@mrmzone.shop` / `demo`.
Demo coupons: `WINTER10`, `MRM100`. Demo landing page: `/lp/winter-combo`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | dev server on :3000 |
| `npm run build` | production build (`output: 'standalone'`) |
| `npm start` | serve the production build |
| `npm run lint` | ESLint (next/core-web-vitals + typescript) |
| `npm run typecheck` | `tsc --noEmit` |

`NEXT_PUBLIC_*` variables are inlined at **build** time — rebuild after changing them.

## Docker (VPS)

```bash
docker build -t mrmzone-web \
  --build-arg NEXT_PUBLIC_API_URL=https://api.mrmzone.shop/api/v1 \
  --build-arg NEXT_PUBLIC_SITE_URL=https://mrmzone.shop .
docker run -d --name mrmzone-web -p 3000:3000 --restart unless-stopped mrmzone-web
```

Put Nginx/Caddy in front for TLS. The image runs `node server.js` from the standalone output as a non-root user.

## Structure

```
src/app/(shop)/       storefront pages (header/footer layout)
src/app/(landing)/lp  Facebook-ad landing pages (minimal chrome, inline COD order form)
src/app/admin/        admin panel (client app, bearer token in localStorage)
src/components/ui     Button, Input/Select/Textarea, Card, Badge, Modal, Table, Price
src/components/shop   storefront components (header, product card, checkout form…)
src/components/admin  admin shell, CRUD page, charts, product/landing editors
src/lib/api.ts        typed API client (base URL, auth header, errors, demo switch)
src/lib/types.ts      types mirroring API.md
```

## Behaviour notes

- Catalog pages are server components using `fetch` with ISR (`revalidate` 60–600s); every fetch is wrapped so the site renders empty states when the API is down.
- Cart & wishlist are client-side (localStorage, try/catch), guest-friendly. Wishlist syncs with `/me/wishlist` when logged in.
- Checkout: BD phone validation `^01[3-9]\d{8}$` (Bangla digits accepted), abandoned-cart capture via `POST /checkout/draft` on phone blur, coupon via `/coupons/validate`, free delivery when total qty ≥ `free_delivery_min_qty`.
- Meta Pixel loads only when `/settings.meta_pixel_id` is set: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase (value, BDT). `utm_source/utm_campaign` (or `fbclid`) are captured and sent with orders.
- Admin redirects to `/admin/login` when the token is missing or the user role is `customer`; the sidebar is filtered by role (admin / manager / staff).
