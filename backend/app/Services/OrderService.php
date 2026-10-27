<?php

namespace App\Services;

use App\Models\Blacklist;
use App\Models\Coupon;
use App\Models\IncompleteOrder;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(private StockService $stock, private SmsService $sms) {}

    /** Bangla digits → ASCII, strip spaces/dashes and the +88 prefix. */
    public static function normalizePhone(?string $phone): string
    {
        $phone = strtr((string) $phone, ['০' => '0', '১' => '1', '২' => '2', '৩' => '3', '৪' => '4', '৫' => '5', '৬' => '6', '৭' => '7', '৮' => '8', '৯' => '9']);
        $phone = preg_replace('/\D+/', '', $phone);
        if (str_starts_with($phone, '880')) {
            $phone = substr($phone, 2);
        }

        return $phone;
    }

    public static function deliveryCharge(string $area, int $totalQty): int
    {
        $freeQty = (int) Setting::get('free_delivery_min_qty', 0);
        if ($freeQty > 0 && $totalQty >= $freeQty) {
            return 0;
        }

        return (int) Setting::get($area === 'outside_dhaka' ? 'delivery_outside_dhaka' : 'delivery_inside_dhaka', 0);
    }

    /**
     * Turn requested items into priced order lines (server-side prices only).
     *
     * @param  array<int, array{product_id:int, variant_id?:int|null, quantity:int, price?:int|null}>  $items
     * @return array{lines: array, subtotal: int, cost_total: int, qty: int}
     */
    public function priceItems(array $items, bool $allowPriceOverride = false, bool $checkStock = true): array
    {
        $lines = [];
        $subtotal = 0;
        $cost = 0;
        $qty = 0;
        foreach ($items as $i => $item) {
            $product = Product::with('variants')->find($item['product_id']);
            if (! $product || ($product->status !== 'active' && ! $allowPriceOverride)) {
                throw ValidationException::withMessages(["items.$i.product_id" => 'পণ্যটি পাওয়া যায়নি।']);
            }
            $variant = null;
            if (! empty($item['variant_id'])) {
                $variant = $product->variants->firstWhere('id', (int) $item['variant_id']);
                if (! $variant) {
                    throw ValidationException::withMessages(["items.$i.variant_id" => 'এই ভ্যারিয়েন্টটি পাওয়া যায়নি।']);
                }
            } elseif ($product->variants->isNotEmpty() && ! $allowPriceOverride) {
                throw ValidationException::withMessages(["items.$i.variant_id" => "{$product->name}: সাইজ/রঙ নির্বাচন করুন।"]);
            }
            $quantity = max(1, (int) $item['quantity']);
            $available = $variant ? $variant->stock : $product->stock;
            if ($checkStock && $available < $quantity) {
                throw ValidationException::withMessages(["items.$i.quantity" => "{$product->name}: স্টকে মাত্র {$available}টি আছে।"]);
            }
            $price = $variant?->price ?: $product->final_price;
            if ($allowPriceOverride && isset($item['price']) && $item['price'] !== null) {
                $price = (int) $item['price'];
            }
            $unitCost = (int) ($variant?->cost_price ?: $product->cost_price);
            $lines[] = [
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'name' => $product->name,
                'variant' => $variant?->name,
                'image' => $product->image,
                'price' => $price,
                'cost_price' => $unitCost,
                'quantity' => $quantity,
                'total' => $price * $quantity,
            ];
            $subtotal += $price * $quantity;
            $cost += $unitCost * $quantity;
            $qty += $quantity;
        }

        return ['lines' => $lines, 'subtotal' => $subtotal, 'cost_total' => $cost, 'qty' => $qty];
    }

    /** Create an order from storefront checkout, landing page, app, POS or admin. */
    public function create(array $data, ?int $userId = null, bool $staff = false): Order
    {
        $phone = self::normalizePhone($data['phone']);
        if (! preg_match('/^01[3-9]\d{8}$/', $phone)) {
            throw ValidationException::withMessages(['phone' => 'সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন।']);
        }
        if (! $staff && Blacklist::where('phone', $phone)->exists()) {
            throw ValidationException::withMessages(['phone' => 'দুঃখিত, এই নম্বর থেকে অর্ডার নেওয়া যাচ্ছে না। আমাদের সাথে যোগাযোগ করুন।']);
        }

        return DB::transaction(function () use ($data, $phone, $userId, $staff) {
            $priced = $this->priceItems($data['items'], $staff, ! $staff || ! empty($data['check_stock']));
            $area = $data['delivery_area'] ?? 'inside_dhaka';
            $delivery = array_key_exists('delivery_charge', $data) && $staff && $data['delivery_charge'] !== null
                ? (int) $data['delivery_charge']
                : self::deliveryCharge($area, $priced['qty']);

            $discount = 0;
            $couponCode = null;
            if (! empty($data['coupon_code'])) {
                $coupon = Coupon::whereRaw('UPPER(code) = ?', [strtoupper($data['coupon_code'])])->lockForUpdate()->first();
                $res = $coupon ? $coupon->evaluate($priced['subtotal']) : ['error' => 'কুপন কোডটি সঠিক নয়।'];
                if (isset($res['error'])) {
                    throw ValidationException::withMessages(['coupon_code' => $res['error']]);
                }
                $discount = $res['discount'];
                $couponCode = $coupon->code;
                $coupon->increment('used');
            }
            if ($staff && isset($data['discount'])) {
                $discount += (int) $data['discount'];
            }
            $advance = $staff ? (int) ($data['advance_paid'] ?? 0) : 0;
            $total = max(0, $priced['subtotal'] + $delivery - $discount);

            $order = Order::create([
                'number' => Order::generateNumber(),
                'user_id' => $userId,
                'status' => $data['status'] ?? 'pending',
                'payment_method' => $data['payment_method'] ?? 'cod',
                'payment_status' => $advance >= $total && $total > 0 ? 'paid' : ($advance > 0 ? 'partial' : 'unpaid'),
                'customer_name' => $data['customer_name'],
                'phone' => $phone,
                'address' => $data['address'],
                'district' => $data['district'] ?? null,
                'delivery_area' => $area,
                'note' => $data['note'] ?? null,
                'subtotal' => $priced['subtotal'],
                'delivery_charge' => $delivery,
                'discount' => $discount,
                'advance_paid' => $advance,
                'total' => $total,
                'cost_total' => $priced['cost_total'],
                'coupon_code' => $couponCode,
                'source' => $data['source'] ?? 'web',
                'ip' => request()?->ip(),
                'utm_source' => $data['utm_source'] ?? null,
                'utm_campaign' => $data['utm_campaign'] ?? null,
            ]);
            $order->items()->createMany($priced['lines']);
            if (! in_array($order->status, Order::RELEASES_STOCK, true)) {
                $this->stock->deductForOrder($order);
            }
            if ($order->status === 'delivered') {
                $order->forceFill(['delivered_at' => now(), 'payment_status' => 'paid'])->save();
                foreach ($priced['lines'] as $line) {
                    Product::whereKey($line['product_id'])->increment('sold_count', $line['quantity']);
                }
            }
            $this->log($order, $order->status, $staff ? 'অর্ডার তৈরি করা হয়েছে (অ্যাডমিন)' : 'অর্ডার গ্রহণ করা হয়েছে');

            IncompleteOrder::where('phone', $phone)->where('status', 'open')
                ->when(! empty($data['draft_id']), fn ($q) => $q->orWhere('id', $data['draft_id']))
                ->update(['status' => 'converted', 'order_id' => $order->id]);

            DB::afterCommit(fn () => $this->sms->orderEvent($order, 'placed'));

            return $order->load('items', 'history');
        });
    }

    /** Replace items/charges on an existing order (admin edit). */
    public function update(Order $order, array $data): Order
    {
        return DB::transaction(function () use ($order, $data) {
            $fields = array_intersect_key($data, array_flip([
                'customer_name', 'address', 'district', 'delivery_area', 'note', 'admin_note',
                'payment_method', 'source', 'assigned_to',
            ]));
            if (isset($data['phone'])) {
                $fields['phone'] = self::normalizePhone($data['phone']);
            }
            if (isset($data['items'])) {
                $this->stock->restoreForOrder($order);
                $priced = $this->priceItems($data['items'], true, false);
                $order->items()->delete();
                $order->items()->createMany($priced['lines']);
                $fields['subtotal'] = $priced['subtotal'];
                $fields['cost_total'] = $priced['cost_total'];
            }
            $order->fill($fields);
            foreach (['delivery_charge', 'discount', 'advance_paid'] as $k) {
                if (array_key_exists($k, $data) && $data[$k] !== null) {
                    $order->{$k} = (int) $data[$k];
                }
            }
            $order->total = max(0, $order->subtotal + $order->delivery_charge - $order->discount);
            $order->payment_status = $order->advance_paid >= $order->total && $order->total > 0 ? 'paid' : ($order->advance_paid > 0 ? 'partial' : 'unpaid');
            $order->save();
            if (isset($data['items']) && ! in_array($order->status, Order::RELEASES_STOCK, true)) {
                $order->stock_deducted = false;
                $this->stock->deductForOrder($order->refresh());
            }
            $this->log($order, $order->status, 'অর্ডার এডিট করা হয়েছে');

            return $order->refresh()->load('items', 'history');
        });
    }

    public function changeStatus(Order $order, string $status, ?string $note = null): Order
    {
        if (! array_key_exists($status, Order::STATUSES)) {
            throw ValidationException::withMessages(['status' => 'অজানা স্ট্যাটাস।']);
        }
        if ($order->status === $status) {
            return $order;
        }
        DB::transaction(function () use ($order, $status, $note) {
            if (in_array($status, Order::RELEASES_STOCK, true)) {
                $this->stock->restoreForOrder($order);
            } elseif (in_array($order->status, Order::RELEASES_STOCK, true)) {
                $this->stock->deductForOrder($order);
            }
            $order->status = $status;
            if ($status === 'delivered') {
                $order->delivered_at = now();
                $order->payment_status = 'paid';
                foreach ($order->items as $item) {
                    Product::whereKey($item->product_id)->increment('sold_count', $item->quantity);
                }
            }
            $order->save();
            $this->log($order, $status, $note);
        });
        if ($status === 'confirmed') {
            $this->sms->orderEvent($order, 'confirmed');
        }

        return $order->refresh()->load('items', 'history');
    }

    public function log(Order $order, string $status, ?string $note = null): void
    {
        OrderStatusHistory::create([
            'order_id' => $order->id,
            'user_id' => auth()->id(),
            'status' => $status,
            'note' => $note,
        ]);
    }

    /** Helper for variant validation lookups. */
    public static function variantName(?int $variantId): ?string
    {
        return $variantId ? ProductVariant::whereKey($variantId)->value('name') : null;
    }
}
