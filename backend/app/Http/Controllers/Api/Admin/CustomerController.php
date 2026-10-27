<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Blacklist;
use App\Models\Order;
use App\Services\FraudCheckService;
use App\Services\OrderService;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $q = Order::query()->selectRaw("
                phone, max(customer_name) as name, max(address) as address, count(*) as orders_count,
                sum(case when status = 'delivered' then total else 0 end) as total_spent,
                sum(case when status = 'delivered' then 1 else 0 end) as delivered,
                sum(case when status in ('cancelled','returned') then 1 else 0 end) as failed,
                max(created_at) as last_order_at")
            ->groupBy('phone');
        if ($s = $request->query('search')) {
            $q->where(fn ($w) => $w->where('phone', 'like', "%$s%")->orWhere('customer_name', 'like', "%$s%"));
        }
        $page = $q->orderByDesc('last_order_at')->paginate(20);
        $black = Blacklist::whereIn('phone', collect($page->items())->pluck('phone'))->pluck('reason', 'phone');

        return response()->json([
            'data' => collect($page->items())->map(fn ($r) => [
                'phone' => $r->phone, 'name' => $r->name, 'address' => $r->address,
                'orders_count' => (int) $r->orders_count, 'total_spent' => (int) $r->total_spent,
                'delivered' => (int) $r->delivered, 'failed' => (int) $r->failed,
                'last_order_at' => $r->last_order_at, 'blacklisted' => $black->has($r->phone), 'blacklist_reason' => $black[$r->phone] ?? null,
            ]),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total()],
        ]);
    }

    public function blacklist(Request $request)
    {
        $v = $request->validate(['phone' => 'required|string|max:20', 'reason' => 'nullable|string|max:255']);
        $b = Blacklist::updateOrCreate(['phone' => OrderService::normalizePhone($v['phone'])], ['reason' => $v['reason'] ?? null]);

        return response()->json(['data' => $b], 201);
    }

    public function unblacklist(string $phone)
    {
        Blacklist::where('phone', OrderService::normalizePhone($phone))->delete();

        return response()->json(['message' => 'Removed']);
    }

    public function blacklistIndex()
    {
        return response()->json(['data' => Blacklist::latest()->limit(500)->get()]);
    }

    public function fraudCheck(Request $request, FraudCheckService $fraud)
    {
        $v = $request->validate(['phone' => 'required|string|max:20', 'fresh' => 'nullable|boolean']);

        return response()->json(['data' => $fraud->check($v['phone'], (bool) ($v['fresh'] ?? false))]);
    }
}
