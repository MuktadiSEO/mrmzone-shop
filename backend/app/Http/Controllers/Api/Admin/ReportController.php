<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\IncompleteOrder;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Http\Resources\OrderResource;
use App\Http\Resources\ProductCardResource;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    private function range(Request $request): array
    {
        if ($request->query('from') || $request->query('to')) {
            return [Carbon::parse($request->query('from', now()->subDays(29)->toDateString()))->startOfDay(), Carbon::parse($request->query('to', now()->toDateString()))->endOfDay()];
        }

        return match ($request->query('range', '30d')) {
            'today' => [now()->startOfDay(), now()->endOfDay()],
            'yesterday' => [now()->subDay()->startOfDay(), now()->subDay()->endOfDay()],
            '7d' => [now()->subDays(6)->startOfDay(), now()->endOfDay()],
            'month' => [now()->startOfMonth(), now()->endOfDay()],
            'last_month' => [now()->subMonthNoOverflow()->startOfMonth(), now()->subMonthNoOverflow()->endOfMonth()],
            'year' => [now()->startOfYear(), now()->endOfDay()],
            default => [now()->subDays(29)->startOfDay(), now()->endOfDay()],
        };
    }

    private function byDay(Carbon $from, Carbon $to): array
    {
        $rows = Order::whereBetween('created_at', [$from, $to])
            ->selectRaw("DATE(created_at) as d, count(*) as orders,
                sum(case when status not in ('cancelled','returned') then total else 0 end) as revenue,
                sum(case when status = 'delivered' then 1 else 0 end) as delivered")
            ->groupBy('d')->get()->keyBy('d');
        $out = [];
        for ($d = $from->copy()->startOfDay(); $d->lte($to); $d->addDay()) {
            $k = $d->toDateString();
            $out[] = ['date' => $k, 'orders' => (int) ($rows[$k]->orders ?? 0), 'revenue' => (int) ($rows[$k]->revenue ?? 0), 'delivered' => (int) ($rows[$k]->delivered ?? 0)];
            if (count($out) > 400) {
                break;
            }
        }

        return $out;
    }

    public function dashboard(Request $request)
    {
        [$from, $to] = $this->range($request->merge(['range' => $request->query('range', 'today')]));
        $base = Order::whereBetween('created_at', [$from, $to]);
        $counts = (clone $base)->selectRaw('status, count(*) as c')->groupBy('status')->pluck('c', 'status');
        $money = (clone $base)->whereNotIn('status', ['cancelled', 'returned'])
            ->selectRaw('coalesce(sum(total),0) as revenue, coalesce(sum(total - delivery_charge - cost_total),0) as profit')->first();
        $chartFrom = $from->diffInDays($to) < 6 ? now()->subDays(6)->startOfDay() : $from;

        $top = OrderItem::query()->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereBetween('orders.created_at', [$from, $to])->whereNotIn('orders.status', ['cancelled', 'returned'])
            ->selectRaw('order_items.product_id as id, max(order_items.name) as name, sum(order_items.quantity) as qty, sum(order_items.total) as revenue')
            ->groupBy('order_items.product_id')->orderByDesc('qty')->limit(5)->get();

        $low = Product::active()->with('variants')->whereColumn('stock', '<=', 'low_stock_threshold')->orderBy('stock')->limit(8)->get();

        return response()->json([
            'cards' => [
                'total_orders' => (int) $counts->sum(),
                'pending' => (int) ($counts['pending'] ?? 0),
                'confirmed' => (int) ($counts['confirmed'] ?? 0) + (int) ($counts['processing'] ?? 0),
                'shipped' => (int) ($counts['shipped'] ?? 0),
                'delivered' => (int) ($counts['delivered'] ?? 0),
                'partial' => (int) ($counts['partial'] ?? 0),
                'cancelled' => (int) ($counts['cancelled'] ?? 0),
                'returned' => (int) ($counts['returned'] ?? 0),
                'on_hold' => (int) ($counts['on_hold'] ?? 0),
                'incomplete' => IncompleteOrder::where('status', 'open')->whereBetween('updated_at', [$from, $to])->count(),
                'revenue' => (int) $money->revenue,
                'profit' => (int) $money->profit,
            ],
            'sales_chart' => $this->byDay($chartFrom, $to),
            'status_breakdown' => $counts->map(fn ($c, $s) => ['status' => $s, 'label' => Order::STATUSES[$s] ?? $s, 'count' => (int) $c])->values(),
            'top_products' => $top->map(fn ($r) => ['id' => $r->id, 'name' => $r->name, 'qty' => (int) $r->qty, 'revenue' => (int) $r->revenue]),
            'low_stock' => $low->map(fn ($p) => (new ProductCardResource($p))->resolve($request) + ['stock' => $p->total_stock]),
            'recent_orders' => OrderResource::collection(Order::with('items')->latest('id')->limit(8)->get())->resolve($request),
            'range' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
        ]);
    }

    public function summary(Request $request)
    {
        [$from, $to] = $this->range($request);
        $orders = Order::whereBetween('created_at', [$from, $to]);
        $delivered = (clone $orders)->whereIn('status', ['delivered', 'partial'])
            ->selectRaw('count(*) as c, coalesce(sum(total),0) as revenue, coalesce(sum(cost_total),0) as cogs, coalesce(sum(delivery_charge),0) as delivery')->first();
        $expenses = (int) Expense::whereBetween('date', [$from->toDateString(), $to->toDateString()])->sum('amount');
        $byCategory = Expense::whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('category, sum(amount) as amount')->groupBy('category')->orderByDesc('amount')->get();
        $gross = (int) $delivered->revenue - (int) $delivered->cogs - (int) $delivered->delivery;

        return response()->json([
            'from' => $from->toDateString(), 'to' => $to->toDateString(),
            'orders' => (clone $orders)->count(),
            'delivered' => (int) $delivered->c,
            'returned' => (clone $orders)->where('status', 'returned')->count(),
            'cancelled' => (clone $orders)->where('status', 'cancelled')->count(),
            'revenue' => (int) $delivered->revenue,
            'cogs' => (int) $delivered->cogs,
            'delivery_charges' => (int) $delivered->delivery,
            'gross_profit' => $gross,
            'expenses' => $expenses,
            'expenses_by_category' => $byCategory,
            'net_profit' => $gross - $expenses,
            'by_day' => $this->byDay($from, $to),
        ]);
    }

    public function products(Request $request)
    {
        [$from, $to] = $this->range($request);
        $rows = OrderItem::query()->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereBetween('orders.created_at', [$from, $to])
            ->selectRaw("order_items.product_id as id, max(order_items.name) as name,
                sum(case when orders.status not in ('cancelled','returned') then order_items.quantity else 0 end) as qty,
                sum(case when orders.status not in ('cancelled','returned') then order_items.total else 0 end) as revenue,
                sum(case when orders.status not in ('cancelled','returned') then order_items.cost_price * order_items.quantity else 0 end) as cost,
                sum(case when orders.status = 'returned' then order_items.quantity else 0 end) as returned_qty")
            ->groupBy('order_items.product_id')->orderByDesc('qty')->limit(200)->get();
        $stock = Product::withTrashed()->whereIn('id', $rows->pluck('id'))->pluck('stock', 'id');

        return response()->json(['data' => $rows->map(fn ($r) => [
            'id' => $r->id, 'name' => $r->name, 'qty' => (int) $r->qty, 'revenue' => (int) $r->revenue,
            'cost' => (int) $r->cost, 'profit' => (int) $r->revenue - (int) $r->cost, 'returned_qty' => (int) $r->returned_qty,
            'stock' => (int) ($stock[$r->id] ?? 0),
        ])]);
    }
}
