<?php

namespace Tests\Feature;

use App\Models\Blacklist;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StorefrontTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_settings_home_and_catalog(): void
    {
        $this->getJson('/api/v1/settings')->assertOk()
            ->assertJsonPath('delivery.inside_dhaka', 70)
            ->assertJsonMissingPath('steadfast_api_key');

        $this->getJson('/api/v1/home')->assertOk()
            ->assertJsonStructure(['banners', 'categories' => [['id', 'name', 'slug', 'icon']], 'sections' => [['title', 'slug', 'products']]]);

        $this->getJson('/api/v1/categories')->assertOk()->assertJsonCount(6, 'data');

        $this->getJson('/api/v1/products?category=seasonal&sort=price_asc')->assertOk()
            ->assertJsonStructure(['data' => [['id', 'name', 'slug', 'final_price', 'discount_percent', 'in_stock', 'category']], 'meta' => ['total']])
            ->assertJsonPath('meta.total', 2);

        $this->getJson('/api/v1/products?search=হুডি')->assertOk()->assertJsonPath('meta.total', 1);

        $this->getJson('/api/v1/products/fleece-hoodie')->assertOk()
            ->assertJsonPath('data.final_price', 890)
            ->assertJsonCount(6, 'data.variants')
            ->assertJsonStructure(['data' => ['options' => ['color', 'size'], 'related']])
            ->assertJsonMissingPath('data.cost_price');

        $this->getJson('/api/v1/pages/return-policy')->assertOk()->assertJsonPath('data.slug', 'return-policy');
        $this->getJson('/api/v1/landing-pages/winter-shawl-offer')->assertOk()->assertJsonPath('data.product.slug', 'winter-shawl');
        $this->getJson('/api/v1/products/does-not-exist')->assertNotFound();
    }

    public function test_checkout_creates_order_with_server_prices_stock_and_free_delivery(): void
    {
        $hoodie = Product::where('slug', 'fleece-hoodie')->first();
        $variant = $hoodie->variants()->first();
        $wallet = Product::where('slug', 'leather-wallet')->first();

        $res = $this->postJson('/api/v1/orders', [
            'customer_name' => 'রহিম',
            'phone' => '০১৭১২৩৪৫৬৭৮', // Bangla digits are accepted
            'address' => 'বাসা ১২, রোড ৫, মিরপুর, ঢাকা',
            'delivery_area' => 'inside_dhaka',
            'items' => [
                ['product_id' => $hoodie->id, 'variant_id' => $variant->id, 'quantity' => 1, 'price' => 1],
                ['product_id' => $wallet->id, 'quantity' => 1],
            ],
        ])->assertCreated();

        $res->assertJsonPath('data.phone', '01712345678')
            ->assertJsonPath('data.subtotal', 890 + 690)
            ->assertJsonPath('data.delivery_charge', 0) // 2 items → free delivery
            ->assertJsonPath('data.total', 1580)
            ->assertJsonPath('data.status', 'pending');

        $this->assertSame(4, $variant->refresh()->stock);
        $this->assertSame(19, $wallet->refresh()->stock);

        $number = $res->json('data.number');
        $this->getJson("/api/v1/orders/track?number={$number}&phone=01712345678")->assertOk()->assertJsonPath('data.number', $number);
        $this->getJson("/api/v1/orders/track?number={$number}&phone=01800000000")->assertNotFound();
    }

    public function test_single_item_pays_delivery_and_coupon_applies(): void
    {
        $watch = Product::where('slug', 'smart-watch')->first();
        $this->postJson('/api/v1/coupons/validate', ['code' => 'mrmzone10', 'subtotal' => 1990])
            ->assertOk()->assertJsonPath('data.discount', 199);

        $this->postJson('/api/v1/orders', [
            'customer_name' => 'করিম', 'phone' => '01812345678', 'address' => 'চট্টগ্রাম সদর',
            'delivery_area' => 'outside_dhaka', 'coupon_code' => 'MRMZONE10',
            'items' => [['product_id' => $watch->id, 'quantity' => 1]],
        ])->assertCreated()
            ->assertJsonPath('data.delivery_charge', 130)
            ->assertJsonPath('data.discount', 199)
            ->assertJsonPath('data.total', 1990 + 130 - 199);
    }

    public function test_checkout_validation_blacklist_stock_and_variant_required(): void
    {
        $hoodie = Product::where('slug', 'fleece-hoodie')->first();
        $wallet = Product::where('slug', 'leather-wallet')->first();
        $base = ['customer_name' => 'X', 'address' => 'Some address here', 'delivery_area' => 'inside_dhaka'];

        $this->postJson('/api/v1/orders', $base + ['phone' => '12345', 'items' => [['product_id' => $wallet->id, 'quantity' => 1]]])
            ->assertStatus(422)->assertJsonValidationErrors('phone');

        $this->postJson('/api/v1/orders', $base + ['phone' => '01712345678', 'items' => [['product_id' => $hoodie->id, 'quantity' => 1]]])
            ->assertStatus(422)->assertJsonValidationErrors('items.0.variant_id');

        $this->postJson('/api/v1/orders', $base + ['phone' => '01712345678', 'items' => [['product_id' => $wallet->id, 'quantity' => 99]]])
            ->assertStatus(422)->assertJsonValidationErrors('items.0.quantity');

        Blacklist::create(['phone' => '01999999999', 'reason' => 'fake orders']);
        $this->postJson('/api/v1/orders', $base + ['phone' => '01999999999', 'items' => [['product_id' => $wallet->id, 'quantity' => 1]]])
            ->assertStatus(422)->assertJsonValidationErrors('phone');

        $this->assertSame(0, Order::count());
    }

    public function test_incomplete_order_is_captured_and_converted(): void
    {
        $wallet = Product::where('slug', 'leather-wallet')->first();
        $id = $this->postJson('/api/v1/checkout/draft', ['phone' => '01712345678', 'name' => 'Rahim', 'items' => [['product_id' => $wallet->id, 'quantity' => 1]]])
            ->assertOk()->json('data.id');
        $this->assertDatabaseHas('incomplete_orders', ['id' => $id, 'status' => 'open', 'subtotal' => 690]);

        $this->postJson('/api/v1/orders', [
            'customer_name' => 'Rahim', 'phone' => '01712345678', 'address' => 'Mirpur, Dhaka', 'delivery_area' => 'inside_dhaka',
            'draft_id' => $id, 'items' => [['product_id' => $wallet->id, 'quantity' => 1]],
        ])->assertCreated();
        $this->assertDatabaseHas('incomplete_orders', ['id' => $id, 'status' => 'converted']);
    }

    public function test_customer_register_login_orders_and_wishlist(): void
    {
        $token = $this->postJson('/api/v1/auth/register', ['name' => 'Rahim', 'phone' => '01712345678', 'password' => 'secret123'])
            ->assertCreated()->json('token');
        $this->postJson('/api/v1/auth/login', ['login' => '01712345678', 'password' => 'wrong'])->assertStatus(422);
        $this->postJson('/api/v1/auth/login', ['login' => '+8801712345678', 'password' => 'secret123'])->assertOk()->assertJsonPath('user.role', 'customer');

        $auth = ['Authorization' => "Bearer $token"];
        $this->getJson('/api/v1/me', $auth)->assertOk()->assertJsonPath('data.phone', '01712345678');
        $wallet = Product::where('slug', 'leather-wallet')->first();
        $this->postJson("/api/v1/me/wishlist/{$wallet->id}", [], $auth)->assertOk();
        $this->getJson('/api/v1/me/wishlist', $auth)->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/me/orders', $auth)->assertOk();

        // customers cannot open the admin API
        $this->getJson('/api/v1/admin/dashboard', $auth)->assertForbidden();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/admin/dashboard')->assertUnauthorized();
    }

    public function test_reviews_need_approval(): void
    {
        $this->postJson('/api/v1/products/leather-wallet/reviews', ['name' => 'A', 'rating' => 5, 'comment' => 'ভালো'])->assertCreated();
        $this->getJson('/api/v1/products/leather-wallet/reviews')->assertOk()->assertJsonPath('total', 0);
    }

    public function test_variant_stock_syncs_parent(): void
    {
        $hoodie = Product::where('slug', 'fleece-hoodie')->first();
        $this->assertSame((int) ProductVariant::where('product_id', $hoodie->id)->sum('stock'), $hoodie->stock);
    }
}
