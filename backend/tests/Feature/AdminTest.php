<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    private array $auth;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        $admin = User::create(['name' => 'Boss', 'email' => 'boss@test.com', 'password' => 'password123', 'role' => 'admin']);
        $token = $this->postJson('/api/v1/auth/login', ['login' => 'boss@test.com', 'password' => 'password123'])->assertOk()->json('token');
        $this->auth = ['Authorization' => "Bearer $token"];
    }

    private function placeOrder(string $phone = '01712345678'): array
    {
        $wallet = Product::where('slug', 'leather-wallet')->first();

        return $this->postJson('/api/v1/orders', [
            'customer_name' => 'Rahim', 'phone' => $phone, 'address' => 'Mirpur 10, Dhaka', 'delivery_area' => 'inside_dhaka',
            'items' => [['product_id' => $wallet->id, 'quantity' => 2]],
        ])->assertCreated()->json('data');
    }

    public function test_dashboard_and_reports(): void
    {
        $this->placeOrder();
        $this->getJson('/api/v1/admin/dashboard?range=today', $this->auth)->assertOk()
            ->assertJsonPath('cards.total_orders', 1)->assertJsonPath('cards.pending', 1)
            ->assertJsonStructure(['cards', 'sales_chart', 'status_breakdown', 'top_products', 'low_stock', 'recent_orders']);
        $this->getJson('/api/v1/admin/reports/summary?range=30d', $this->auth)->assertOk()->assertJsonStructure(['revenue', 'net_profit', 'by_day']);
        $this->getJson('/api/v1/admin/reports/products', $this->auth)->assertOk();
    }

    public function test_order_list_status_changes_restore_stock_and_track_profit(): void
    {
        $order = $this->placeOrder();
        $wallet = Product::where('slug', 'leather-wallet')->first();
        $this->assertSame(18, $wallet->stock);

        $this->getJson('/api/v1/admin/orders?status=pending', $this->auth)->assertOk()
            ->assertJsonPath('meta.counts.pending', 1)->assertJsonPath('data.0.number', $order['number'])
            ->assertJsonPath('data.0.profit', 1380 - 500);

        $this->postJson("/api/v1/admin/orders/{$order['id']}/status", ['status' => 'cancelled', 'note' => 'Customer cancelled'], $this->auth)->assertOk()
            ->assertJsonPath('data.status', 'cancelled');
        $this->assertSame(20, $wallet->refresh()->stock);

        $this->postJson("/api/v1/admin/orders/{$order['id']}/status", ['status' => 'confirmed'], $this->auth)->assertOk();
        $this->assertSame(18, $wallet->refresh()->stock);

        $this->postJson('/api/v1/admin/orders/bulk-status', ['ids' => [$order['id']], 'status' => 'delivered'], $this->auth)->assertOk()->assertJsonPath('updated', 1);
        $this->assertSame(2, $wallet->refresh()->sold_count);
        $this->assertSame('paid', Order::find($order['id'])->payment_status);
    }

    public function test_admin_edits_order_items_and_charges(): void
    {
        $order = $this->placeOrder();
        $watch = Product::where('slug', 'smart-watch')->first();
        $this->putJson("/api/v1/admin/orders/{$order['id']}", [
            'items' => [['product_id' => $watch->id, 'quantity' => 1, 'price' => 1800]],
            'delivery_charge' => 60, 'discount' => 100, 'advance_paid' => 200, 'admin_note' => 'called, confirmed',
        ], $this->auth)->assertOk()
            ->assertJsonPath('data.subtotal', 1800)->assertJsonPath('data.total', 1760)->assertJsonPath('data.due', 1560)->assertJsonPath('data.payment_status', 'partial');
        $this->assertSame(20, Product::where('slug', 'leather-wallet')->first()->stock);
        $this->assertSame(19, $watch->refresh()->stock);
    }

    public function test_manual_pos_order(): void
    {
        $watch = Product::where('slug', 'smart-watch')->first();
        $this->postJson('/api/v1/admin/orders', [
            'customer_name' => 'Walk-in', 'phone' => '01512345678', 'address' => 'Shop counter', 'delivery_area' => 'inside_dhaka',
            'source' => 'pos', 'status' => 'delivered', 'delivery_charge' => 0, 'items' => [['product_id' => $watch->id, 'quantity' => 1]],
        ], $this->auth)->assertCreated()->assertJsonPath('data.source', 'pos')->assertJsonPath('data.delivery_charge', 0)
            ->assertJsonPath('data.payment_status', 'paid');
        $this->assertSame(1, $watch->refresh()->sold_count);
        $this->assertSame(19, $watch->stock);
    }

    public function test_steadfast_booking_and_status_refresh(): void
    {
        Setting::put(['steadfast_api_key' => 'k', 'steadfast_secret_key' => 's', 'sms_on_order_shipped' => '0', 'sms_on_order_placed' => '0']);
        Http::fake([
            'portal.packzy.com/api/v1/create_order' => Http::response(['status' => 200, 'consignment' => ['consignment_id' => 1424107, 'tracking_code' => '15BAEB8A', 'status' => 'in_review']]),
            'portal.packzy.com/api/v1/status_by_cid/*' => Http::response(['status' => 200, 'delivery_status' => 'delivered']),
        ]);
        $order = $this->placeOrder();

        $this->postJson("/api/v1/admin/orders/{$order['id']}/courier", ['courier' => 'steadfast'], $this->auth)->assertOk()
            ->assertJsonPath('data.status', 'shipped')->assertJsonPath('data.consignment_id', '1424107')->assertJsonPath('data.tracking_code', '15BAEB8A');
        Http::assertSent(fn ($r) => str_contains($r->url(), 'create_order') && $r['invoice'] === $order['number'] && $r['cod_amount'] === 1380 && $r->hasHeader('Api-Key', 'k'));

        $this->postJson("/api/v1/admin/orders/{$order['id']}/courier", ['courier' => 'steadfast'], $this->auth)->assertStatus(422);

        $this->postJson("/api/v1/admin/orders/{$order['id']}/courier/refresh", [], $this->auth)->assertOk()
            ->assertJsonPath('data.courier_status', 'delivered')->assertJsonPath('data.status', 'delivered');
    }

    public function test_courier_without_credentials_gives_clear_error(): void
    {
        $order = $this->placeOrder();
        $this->postJson("/api/v1/admin/orders/{$order['id']}/courier", ['courier' => 'pathao'], $this->auth)
            ->assertStatus(422)->assertJsonFragment(['message' => 'Pathao সেটিংস অসম্পূর্ণ (pathao_client_id)।']);
    }

    public function test_fraud_check_and_blacklist(): void
    {
        $o = $this->placeOrder('01612345678');
        $this->postJson("/api/v1/admin/orders/{$o['id']}/status", ['status' => 'returned'], $this->auth);
        $this->getJson('/api/v1/admin/fraud-check?phone=01612345678', $this->auth)->assertOk()
            ->assertJsonPath('data.local.returned', 1)->assertJsonPath('data.risk', 'high');
        $this->postJson('/api/v1/admin/blacklist', ['phone' => '01612345678', 'reason' => 'returns'], $this->auth)->assertCreated();
        $this->getJson('/api/v1/admin/customers?search=0161', $this->auth)->assertOk()->assertJsonPath('data.0.blacklisted', true);
    }

    public function test_product_crud_with_variants_and_purchase_stock_in(): void
    {
        $cat = $this->getJson('/api/v1/admin/categories?all=1', $this->auth)->assertOk()->json('data.0.id');
        $id = $this->postJson('/api/v1/admin/products', [
            'name' => 'Test Tee', 'price' => 500, 'sale_price' => 450, 'cost_price' => 200, 'category_id' => $cat,
            'images' => ['https://example.com/a.jpg'],
            'variants' => [
                ['attributes' => ['size' => 'M'], 'stock' => 3],
                ['attributes' => ['size' => 'L'], 'stock' => 2, 'price' => 480],
            ],
        ], $this->auth)->assertCreated()->assertJsonPath('data.stock', 5)->assertJsonPath('data.slug', 'test-tee')->json('data.id');

        $variants = $this->getJson("/api/v1/admin/products/$id", $this->auth)->json('data.variants');
        $this->postJson('/api/v1/admin/purchases', [
            'date' => now()->toDateString(), 'items' => [['product_id' => $id, 'variant_id' => $variants[0]['id'], 'quantity' => 10, 'unit_cost' => 210]],
        ], $this->auth)->assertCreated();
        $this->assertSame(15, Product::find($id)->stock);

        $this->putJson("/api/v1/admin/products/$id", ['name' => 'Test Tee 2', 'price' => 520, 'status' => 'draft'], $this->auth)->assertOk()->assertJsonPath('data.status', 'draft');
        $this->getJson('/api/v1/products/test-tee')->assertNotFound();
        $this->deleteJson("/api/v1/admin/products/$id", [], $this->auth)->assertOk();
    }

    public function test_simple_cruds_settings_and_roles(): void
    {
        $this->postJson('/api/v1/admin/coupons', ['code' => 'eid50', 'type' => 'fixed', 'value' => 50], $this->auth)->assertCreated()->assertJsonPath('data.code', 'EID50');
        $this->postJson('/api/v1/admin/expenses', ['category' => 'Facebook Ads', 'amount' => 1500, 'date' => now()->toDateString()], $this->auth)->assertCreated();
        $this->postJson('/api/v1/admin/banners', ['title' => 'Eid', 'image' => 'https://example.com/b.jpg'], $this->auth)->assertCreated();
        $this->putJson('/api/v1/admin/settings', ['delivery' => ['inside_dhaka' => 60], 'tracking' => ['meta_pixel_id' => '123'], 'sms_templates' => ['enabled' => ['order_placed' => false]]], $this->auth)->assertOk()
            ->assertJsonPath('data.delivery.inside_dhaka', 60)->assertJsonPath('data.sms_templates.enabled.order_placed', false)->assertJsonPath('data.courier.default', 'steadfast');
        $this->getJson('/api/v1/settings')->assertJsonPath('delivery.inside_dhaka', 60)->assertJsonPath('meta_pixel_id', '123');

        $this->postJson('/api/v1/admin/staff', ['name' => 'Desk', 'email' => 'desk@test.com', 'password' => 'password123', 'role' => 'staff'], $this->auth)->assertCreated();
        $this->app['auth']->forgetGuards();
        $staffToken = $this->postJson('/api/v1/auth/login', ['login' => 'desk@test.com', 'password' => 'password123'])->json('token');
        $staff = ['Authorization' => "Bearer $staffToken"];
        $this->getJson('/api/v1/admin/orders', $staff)->assertOk();
        $this->getJson('/api/v1/admin/settings', $staff)->assertForbidden();
        $this->postJson('/api/v1/admin/products', ['name' => 'x', 'price' => 1], $staff)->assertForbidden();
    }
}
