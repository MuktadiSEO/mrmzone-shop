<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\IncompleteOrder;
use App\Models\Product;
use App\Services\OrderService;
use Illuminate\Http\Request;

class IncompleteOrderController extends Controller
{
    public function __construct(private OrderService $orders) {}

    public function index(Request $request)
    {
        $page = IncompleteOrder::where('status', $request->query('status', 'open'))
            ->when($request->query('search'), fn ($q, $s) => $q->where(fn ($w) => $w->where('phone', 'like', "%$s%")->orWhere('name', 'like', "%$s%")))
            ->latest('updated_at')->paginate(20);
        $productIds = collect($page->items())->flatMap(fn ($d) => collect($d->items ?? [])->pluck('product_id'))->unique();
        $products = Product::withTrashed()->whereIn('id', $productIds)->get(['id', 'name', 'images', 'price', 'sale_price'])->keyBy('id');

        return response()->json([
            'data' => collect($page->items())->map(fn ($d) => $d->toArray() + [
                'products' => collect($d->items ?? [])->map(fn ($i) => [
                    'product_id' => $i['product_id'], 'variant_id' => $i['variant_id'] ?? null, 'quantity' => $i['quantity'],
                    'name' => $products[$i['product_id']]->name ?? 'Deleted product', 'image' => $products[$i['product_id']]->image ?? null,
                ])->values(),
            ]),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total()],
        ]);
    }

    public function convert(Request $request, int $id)
    {
        $draft = IncompleteOrder::where('status', 'open')->findOrFail($id);
        $v = $request->validate([
            'customer_name' => 'nullable|string|max:100', 'address' => 'nullable|string|max:500',
            'delivery_area' => 'nullable|in:inside_dhaka,outside_dhaka', 'items' => 'nullable|array|min:1',
        ]);
        $order = $this->orders->create([
            'customer_name' => $v['customer_name'] ?? $draft->name ?? 'Customer',
            'phone' => $draft->phone,
            'address' => $v['address'] ?? $draft->address ?? 'N/A',
            'delivery_area' => $v['delivery_area'] ?? 'inside_dhaka',
            'items' => $v['items'] ?? $draft->items,
            'source' => 'web',
            'draft_id' => $draft->id,
        ], null, true);

        return (new OrderResource($order))->response()->setStatusCode(201);
    }

    public function destroy(int $id)
    {
        IncompleteOrder::findOrFail($id)->update(['status' => 'dismissed']);

        return response()->json(['message' => 'Dismissed']);
    }
}
