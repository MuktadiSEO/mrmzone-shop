<?php

use App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\StoreController;
use Illuminate\Support\Facades\Route;

/*
| MRM Zone Shop API v1 — used by the Next.js storefront, the admin panel
| and the future Android / iOS apps. See docs/API.md.
*/

Route::prefix('v1')->group(function () {
    // ── Storefront (public) ───────────────────────────────────────────
    Route::get('settings', [StoreController::class, 'settings']);
    Route::get('home', [StoreController::class, 'home']);
    Route::get('pages/{slug}', [StoreController::class, 'page']);
    Route::get('landing-pages/{slug}', [StoreController::class, 'landingPage']);

    Route::get('categories', [CatalogController::class, 'categories']);
    Route::get('categories/{slug}', [CatalogController::class, 'category']);
    Route::get('products', [CatalogController::class, 'products']);
    Route::get('products/{slug}', [CatalogController::class, 'product']);
    Route::get('products/{slug}/reviews', [CatalogController::class, 'reviews']);
    Route::post('products/{slug}/reviews', [CatalogController::class, 'storeReview'])->middleware('throttle:5,1');

    Route::middleware('throttle:checkout')->group(function () {
        Route::post('coupons/validate', [CheckoutController::class, 'validateCoupon']);
        Route::post('checkout/draft', [CheckoutController::class, 'draft']);
        Route::post('orders', [CheckoutController::class, 'store']);
        Route::get('orders/track', [CheckoutController::class, 'track']);
    });

    // ── Customer auth (web + mobile apps) ─────────────────────────────
    Route::post('auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::put('me', [AuthController::class, 'updateMe']);
        Route::get('me/orders', [AuthController::class, 'orders']);
        Route::get('me/wishlist', [AuthController::class, 'wishlist']);
        Route::post('me/wishlist/{productId}', [AuthController::class, 'addWishlist'])->whereNumber('productId');
        Route::delete('me/wishlist/{productId}', [AuthController::class, 'removeWishlist'])->whereNumber('productId');
    });

    // ── Admin panel ───────────────────────────────────────────────────
    Route::prefix('admin')->middleware(['auth:sanctum', 'staff'])->group(function () {
        // all staff: orders desk
        Route::get('dashboard', [Admin\ReportController::class, 'dashboard']);
        Route::get('orders', [Admin\OrderController::class, 'index']);
        Route::post('orders', [Admin\OrderController::class, 'store']);
        Route::post('orders/bulk-status', [Admin\OrderController::class, 'bulkStatus']);
        Route::post('orders/bulk-courier', [Admin\OrderController::class, 'bulkCourier']);
        Route::get('orders/{id}', [Admin\OrderController::class, 'show'])->whereNumber('id');
        Route::put('orders/{id}', [Admin\OrderController::class, 'update'])->whereNumber('id');
        Route::delete('orders/{id}', [Admin\OrderController::class, 'destroy'])->whereNumber('id')->middleware('staff:admin,manager');
        Route::post('orders/{id}/status', [Admin\OrderController::class, 'status'])->whereNumber('id');
        Route::post('orders/{id}/courier', [Admin\OrderController::class, 'courier'])->whereNumber('id');
        Route::post('orders/{id}/courier/refresh', [Admin\OrderController::class, 'refreshCourier'])->whereNumber('id');
        Route::get('orders/{id}/invoice', [Admin\OrderController::class, 'invoice'])->whereNumber('id');
        Route::get('courier/balance', [Admin\OrderController::class, 'courierBalance']);

        Route::get('incomplete-orders', [Admin\IncompleteOrderController::class, 'index']);
        Route::post('incomplete-orders/{id}/convert', [Admin\IncompleteOrderController::class, 'convert']);
        Route::delete('incomplete-orders/{id}', [Admin\IncompleteOrderController::class, 'destroy']);

        Route::get('customers', [Admin\CustomerController::class, 'index']);
        Route::get('fraud-check', [Admin\CustomerController::class, 'fraudCheck']);
        Route::get('blacklist', [Admin\CustomerController::class, 'blacklistIndex']);
        Route::post('blacklist', [Admin\CustomerController::class, 'blacklist']);
        Route::delete('blacklist/{phone}', [Admin\CustomerController::class, 'unblacklist']);

        // read-only catalog for POS / order editing (all staff)
        Route::get('products', [Admin\ProductController::class, 'index']);
        Route::get('products/{id}', [Admin\ProductController::class, 'show'])->whereNumber('id');
        Route::get('categories', [Admin\CategoryController::class, 'index']);

        // managers & admins: catalog, marketing, inventory, accounting
        Route::middleware('staff:admin,manager')->group(function () {
            Route::post('uploads', [Admin\UploadController::class, 'store']);
            Route::post('products', [Admin\ProductController::class, 'store']);
            Route::put('products/{id}', [Admin\ProductController::class, 'update'])->whereNumber('id');
            Route::delete('products/{id}', [Admin\ProductController::class, 'destroy'])->whereNumber('id');

            Route::apiResource('categories', Admin\CategoryController::class)->except('index');
            Route::apiResource('brands', Admin\BrandController::class);
            Route::apiResource('banners', Admin\BannerController::class);
            Route::apiResource('coupons', Admin\CouponController::class);
            Route::apiResource('landing-pages', Admin\LandingPageController::class);
            Route::apiResource('pages', Admin\PageController::class);
            Route::apiResource('reviews', Admin\ReviewController::class);
            Route::apiResource('suppliers', Admin\SupplierController::class);
            Route::apiResource('expenses', Admin\ExpenseController::class);

            Route::get('purchases', [Admin\PurchaseController::class, 'index']);
            Route::post('purchases', [Admin\PurchaseController::class, 'store']);
            Route::get('purchases/{id}', [Admin\PurchaseController::class, 'show']);
            Route::put('purchases/{id}', [Admin\PurchaseController::class, 'update']);
            Route::get('stock-movements', [Admin\PurchaseController::class, 'movements']);
            Route::post('stock-adjustments', [Admin\PurchaseController::class, 'adjust']);

            Route::get('reports/summary', [Admin\ReportController::class, 'summary']);
            Route::get('reports/products', [Admin\ReportController::class, 'products']);

            Route::post('sms/send', [Admin\SmsController::class, 'send']);
            Route::get('sms/logs', [Admin\SmsController::class, 'logs']);
        });

        // admins only
        Route::middleware('staff:admin')->group(function () {
            Route::get('settings', [Admin\SettingController::class, 'index']);
            Route::put('settings', [Admin\SettingController::class, 'update']);
            Route::apiResource('staff', Admin\StaffController::class);
            Route::get('activity-logs', [Admin\ActivityLogController::class, 'index']);
        });
    });
});
