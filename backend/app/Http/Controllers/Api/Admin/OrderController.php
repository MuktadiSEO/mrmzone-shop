<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\ActivityLog;
use App\Models\Order;
use App\Models\Setting;
use App\Services\Courier\CourierException;
use App\Services\Courier\CourierManager;
use App\Services\OrderService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private OrderService $orders, private CourierManager $couriers) {}

    private function filtered(Request $request)
    {
        $q = Order::query();
        if ($s = trim((string) $request->query('search'))) {
            $phone = OrderService::normalizePhone($s);
            $q->where(fn ($w) => $w->where('number', 'like', "%$s%")->orWhere('customer_name', 'like', "%$s%")
                ->orWhere('phone', 'like', '%'.($phone ?: $s).'%')->orWhere('consignment_id', $s)->orWhere('tracking_code', $s));
        }

        return $q->when($request->query('courier'), fn ($w, $c) => $c === 'none' ? $w->whereNull('courier') : $w->where('courier', $c))
            ->when($request->query('source'), fn ($w, $s) => $w->where('source', $s))
            ->when($request->query('from'), fn ($w, $d) => $w->whereDate('created_at', '>=', $d))
            ->when($request->query('to'), fn ($w, $d) => $w->whereDate('created_at', '<=', $d));
    }

    public function index(Request $request)
    {
        $counts = $this->filtered($request)->selectRaw('status, count(*) as c')->groupBy('status')->pluck('c', 'status');
        $q = $this->filtered($request)->with('items')->when($request->query('status'), fn ($w, $s) => $w->where('status', $s));
        $page = $q->latest('id')->paginate(min((int) $request->query('per_page', 20), 100));
        $all = array_fill_keys(array_keys(Order::STATUSES), 0);

        return OrderResource::collection($page)->additional(['meta' => [
            'counts' => array_merge($all, $counts->map(fn ($c) => (int) $c)->all()) + ['all' => (int) $counts->sum()],
        ]]);
    }

    public function show(int $id)
    {
        return new OrderResource(Order::with('items', 'history.user')->findOrFail($id));
    }

    private function orderRules(bool $create): array
    {
        $r = $create ? 'required' : 'sometimes';

        return [
            'customer_name' => "$r|string|max:100",
            'phone' => "$r|string|max:20",
            'address' => "$r|string|max:500",
            'district' => 'nullable|string|max:60',
            'delivery_area' => "$r|in:inside_dhaka,outside_dhaka",
            'note' => 'nullable|string|max:500',
            'admin_note' => 'nullable|string|max:1000',
            'payment_method' => 'nullable|in:cod,bkash,nagad,cash,card,bank',
            'source' => 'nullable|in:'.implode(',', Order::SOURCES),
            'status' => 'nullable|in:'.implode(',', array_keys(Order::STATUSES)),
            'delivery_charge' => 'nullable|integer|min:0',
            'discount' => 'nullable|integer|min:0',
            'advance_paid' => 'nullable|integer|min:0',
            'coupon_code' => 'nullable|string|max:50',
            'assigned_to' => 'nullable|integer|exists:users,id',
            'items' => "$r|array|min:1",
            'items.*.product_id' => 'required|integer',
            'items.*.variant_id' => 'nullable|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'nullable|integer|min:0',
        ];
    }

    public function store(Request $request)
    {
        $v = $request->validate($this->orderRules(true));
        $v['source'] ??= 'manual';
        $order = $this->orders->create($v, null, true);
        ActivityLog::record('order.created', $order);

        return (new OrderResource($order))->response()->setStatusCode(201);
    }

    public function update(Request $request, int $id)
    {
        $order = Order::findOrFail($id);
        $v = $request->validate($this->orderRules(false));
        $order = $this->orders->update($order, $v);
        if (! empty($v['status']) && $v['status'] !== $order->status) {
            $order = $this->orders->changeStatus($order, $v['status']);
        }
        ActivityLog::record('order.updated', $order);

        return new OrderResource($order->load('history.user'));
    }

    public function status(Request $request, int $id)
    {
        $v = $request->validate(['status' => 'required|in:'.implode(',', array_keys(Order::STATUSES)), 'note' => 'nullable|string|max:255']);
        $order = $this->orders->changeStatus(Order::with('items')->findOrFail($id), $v['status'], $v['note'] ?? null);
        ActivityLog::record('order.status', $order, ['status' => $v['status']]);

        return new OrderResource($order->load('history.user'));
    }

    public function bulkStatus(Request $request)
    {
        $v = $request->validate(['ids' => 'required|array|max:200', 'ids.*' => 'integer', 'status' => 'required|in:'.implode(',', array_keys(Order::STATUSES))]);
        $done = 0;
        foreach (Order::with('items')->whereIn('id', $v['ids'])->get() as $order) {
            $this->orders->changeStatus($order, $v['status'], 'Bulk update');
            $done++;
        }

        return response()->json(['message' => "$done টি অর্ডার আপডেট হয়েছে।", 'updated' => $done]);
    }

    public function courier(Request $request, int $id)
    {
        $v = $request->validate([
            'courier' => 'nullable|in:steadfast,pathao,redx', 'note' => 'nullable|string|max:255', 'weight' => 'nullable|numeric|min:0.1|max:30',
            'city_id' => 'nullable|integer', 'zone_id' => 'nullable|integer', 'area_id' => 'nullable|integer', 'area_name' => 'nullable|string|max:100',
        ]);
        $courier = $v['courier'] ?? Setting::get('default_courier', 'steadfast');
        try {
            $order = $this->couriers->book(Order::with('items')->findOrFail($id), $courier, $v);
        } catch (CourierException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
        ActivityLog::record('order.courier', $order, ['courier' => $courier]);

        return new OrderResource($order->load('history.user'));
    }

    public function bulkCourier(Request $request)
    {
        $v = $request->validate(['ids' => 'required|array|max:100', 'ids.*' => 'integer', 'courier' => 'nullable|in:steadfast,pathao,redx']);
        $courier = $v['courier'] ?? Setting::get('default_courier', 'steadfast');
        $results = [];
        foreach (Order::with('items')->whereIn('id', $v['ids'])->get() as $order) {
            try {
                $o = $this->couriers->book($order, $courier);
                $results[] = ['id' => $order->id, 'number' => $order->number, 'ok' => true, 'consignment_id' => $o->consignment_id];
            } catch (CourierException $e) {
                $results[] = ['id' => $order->id, 'number' => $order->number, 'ok' => false, 'error' => $e->getMessage()];
            }
        }

        return response()->json(['data' => $results, 'message' => collect($results)->where('ok', true)->count().' টি পার্সেল বুক হয়েছে।']);
    }

    public function refreshCourier(int $id)
    {
        try {
            return new OrderResource($this->couriers->refresh(Order::with('items')->findOrFail($id))->load('history.user'));
        } catch (CourierException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function courierBalance(Request $request)
    {
        $name = $request->query('courier', Setting::get('default_courier', 'steadfast'));
        try {
            return response()->json(['data' => ['courier' => $name, 'balance' => $this->couriers->driver($name)->balance()]]);
        } catch (CourierException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function invoice(int $id)
    {
        $order = Order::with('items')->findOrFail($id);
        $s = Setting::all_values();

        return (new OrderResource($order))->additional([
            'store' => ['name' => $s['store_name'], 'phone' => $s['store_phone'], 'address' => $s['store_address'], 'email' => $s['store_email'], 'logo' => $s['store_logo'], 'website' => 'mrmzone.shop'],
        ]);
    }

    public function destroy(int $id)
    {
        $order = Order::findOrFail($id);
        if (! in_array($order->status, ['cancelled', 'pending'], true)) {
            return response()->json(['message' => 'শুধু নতুন বা বাতিল অর্ডার মুছা যাবে।'], 422);
        }
        app(\App\Services\StockService::class)->restoreForOrder($order);
        $order->delete();
        ActivityLog::record('order.deleted', $order);

        return response()->json(['message' => 'Deleted']);
    }
}
