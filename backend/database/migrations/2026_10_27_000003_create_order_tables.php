<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('type', 10)->default('fixed');
            $table->unsignedInteger('value');
            $table->unsignedInteger('min_order')->default(0);
            $table->unsignedInteger('max_discount')->nullable();
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('used')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 20)->default('pending')->index();
            $table->string('payment_method', 20)->default('cod');
            $table->string('payment_status', 20)->default('unpaid');
            $table->string('customer_name');
            $table->string('phone', 20)->index();
            $table->text('address');
            $table->string('district')->nullable();
            $table->string('delivery_area', 20)->default('inside_dhaka');
            $table->text('note')->nullable();
            $table->text('admin_note')->nullable();
            $table->unsignedInteger('subtotal')->default(0);
            $table->unsignedInteger('delivery_charge')->default(0);
            $table->unsignedInteger('discount')->default(0);
            $table->unsignedInteger('advance_paid')->default(0);
            $table->unsignedInteger('total')->default(0);
            $table->unsignedInteger('cost_total')->default(0);
            $table->string('coupon_code')->nullable();
            $table->string('source', 20)->default('web')->index();
            $table->string('courier', 20)->nullable()->index();
            $table->string('consignment_id')->nullable();
            $table->string('tracking_code')->nullable();
            $table->string('courier_status')->nullable();
            $table->timestamp('courier_booked_at')->nullable();
            $table->string('ip', 45)->nullable();
            $table->string('utm_source')->nullable();
            $table->string('utm_campaign')->nullable();
            $table->boolean('stock_deducted')->default(false);
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
            $table->index('created_at');
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->string('name');
            $table->string('variant')->nullable();
            $table->string('image')->nullable();
            $table->unsignedInteger('price');
            $table->unsignedInteger('cost_price')->default(0);
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('total');
            $table->timestamps();
        });

        Schema::create('order_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status', 20);
            $table->string('note')->nullable();
            $table->timestamps();
        });

        Schema::create('incomplete_orders', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('phone', 20)->index();
            $table->text('address')->nullable();
            $table->json('items')->nullable();
            $table->unsignedInteger('subtotal')->default(0);
            $table->string('ip', 45)->nullable();
            $table->string('status', 20)->default('open');
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('blacklists', function (Blueprint $table) {
            $table->id();
            $table->string('phone', 20)->unique();
            $table->string('reason')->nullable();
            $table->timestamps();
        });

        Schema::create('fraud_checks', function (Blueprint $table) {
            $table->id();
            $table->string('phone', 20)->unique();
            $table->json('result');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['fraud_checks', 'blacklists', 'incomplete_orders', 'order_status_histories', 'order_items', 'orders', 'coupons'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
