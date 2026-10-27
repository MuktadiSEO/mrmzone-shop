<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Coupon;
use App\Models\IncompleteOrder;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    public function __construct(private OrderService $orders) {}

    private function itemRules(): array
    {
        return [
            'items' => 'required|array|min:1|max:50',
            'items.*.product_id' => 'required|integer',
            'items.*.variant_id' => 'nullable|integer',
            'items.*.quantity' => 'required|integer|min:1|max:100',
        ];
    }

    public function validateCoupon(Request $request)
    {
        $v = $request->validate(['code' => 'required|string|max:50', 'subtotal' => 'required|integer|min:0']);
        $coupon = Coupon::whereRaw('UPPER(code) = ?', [strtoupper($v['code'])])->first();
        $res = $coupon ? $coupon->evaluate($v['subtotal']) : ['error' => 'কুপন কোডটি সঠিক নয়।'];
        if (isset($res['error'])) {
            return response()->json(['message' => $res['error'], 'errors' => ['code' => [$res['error']]]], 422);
        }

        return response()->json(['data' => ['code' => $coupon->code, 'type' => $coupon->type, 'value' => $coupon->value, 'discount' => $res['discount']]]);
    }

    public function draft(Request $request)
    {
        $v = $request->validate([
            'name' => 'nullable|string|max:100', 'phone' => 'required|string|max:20', 'address' => 'nullable|string|max:500',
        ] + $this->itemRules());
        $phone = OrderService::normalizePhone($v['phone']);
        if (! preg_match('/^01[3-9]\d{8}$/', $phone)) {
            return response()->json(['message' => 'Invalid phone'], 422);
        }
        $subtotal = 0;
        try {
            $subtotal = $this->orders->priceItems($v['items'], false, false)['subtotal'];
        } catch (\Throwable) {
        }
        $draft = IncompleteOrder::updateOrCreate(
            ['phone' => $phone, 'status' => 'open'],
            ['name' => $v['name'] ?? null, 'address' => $v['address'] ?? null, 'items' => $v['items'], 'subtotal' => $subtotal, 'ip' => $request->ip()],
        );

        return response()->json(['data' => ['id' => $draft->id]]);
    }

    public function store(Request $request)
    {
        $v = $request->validate([
            'customer_name' => 'required|string|max:100',
            'phone' => 'required|string|max:20',
            'address' => 'required|string|min:5|max:500',
            'district' => 'nullable|string|max:60',
            'delivery_area' => 'required|in:inside_dhaka,outside_dhaka',
            'note' => 'nullable|string|max:500',
            'coupon_code' => 'nullable|string|max:50',
            'payment_method' => 'nullable|in:cod',
            'draft_id' => 'nullable|integer',
            'source' => 'nullable|in:web,app,landing',
            'utm_source' => 'nullable|string|max:100',
            'utm_campaign' => 'nullable|string|max:100',
        ] + $this->itemRules());
        $order = $this->orders->create($v, $request->user('sanctum')?->id);

        return (new OrderResource($order))->response()->setStatusCode(201);
    }

    public function track(Request $request)
    {
        $v = $request->validate(['number' => 'required|string|max:30', 'phone' => 'required|string|max:20']);
        $order = Order::with('items', 'history')
            ->where('number', strtoupper(trim($v['number'])))
            ->where('phone', OrderService::normalizePhone($v['phone']))->first();
        if (! $order) {
            return response()->json(['message' => 'অর্ডারটি পাওয়া যায়নি। নম্বর ও মোবাইল মিলিয়ে দেখুন।'], 404);
        }

        return new OrderResource($order);
    }
}
