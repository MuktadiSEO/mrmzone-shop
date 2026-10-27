# MRM Zone Shop — API (Laravel 12)

REST API for the storefront, admin panel and mobile apps. Contract: `../docs/API.md`.

```bash
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed      # admin from ADMIN_EMAIL / ADMIN_PASSWORD
php artisan serve
php artisan test
```

Key pieces:
- `app/Services/OrderService.php` — checkout pricing (server-side), delivery charge, coupons, stock, status changes
- `app/Services/Courier/*` — Steadfast, Pathao, RedX drivers + `CourierManager` (booking, status mapping)
- `app/Services/FraudCheckService.php` — local history + optional external courier check
- `app/Services/SmsService.php` — bulksmsbd.net (or `log` driver)
- `routes/api.php` — all endpoints (public, customer, admin with roles)
- `routes/console.php` — hourly courier status sync, abandoned-checkout cleanup
