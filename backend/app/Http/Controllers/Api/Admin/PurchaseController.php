<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Purchase;
use App\Models\StockMovement;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    public function __construct(private StockService $stock) {}

    public function index(Request $request)
    {
        $page = Purchase::with(['supplier:id,name', 'items.product:id,name'])
            ->when($request->query('supplier_id'), fn ($q, $s) => $q->where('supplier_id', $s))
            ->latest('date')->latest('id')->paginate(20);

        return response()->json([
            'data' => $page->items(),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total()],
        ]);
    }

    public function store(Request $request)
    {
        $v = $request->validate([
            'supplier_id' => 'nullable|integer|exists:suppliers,id',
            'date' => 'required|date',
            'paid' => 'nullable|integer|min:0',
            'note' => 'nullable|string|max:500',
            'update_cost' => 'nullable|boolean',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.variant_id' => 'nullable|integer|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|integer|min:0',
        ]);
        $purchase = DB::transaction(function () use ($v, $request) {
            $total = collect($v['items'])->sum(fn ($i) => $i['quantity'] * $i['unit_cost']);
            $p = Purchase::create([
                'supplier_id' => $v['supplier_id'] ?? null, 'user_id' => $request->user()->id, 'date' => $v['date'],
                'total' => $total, 'paid' => $v['paid'] ?? $total, 'note' => $v['note'] ?? null,
            ]);
            foreach ($v['items'] as $i) {
                $p->items()->create($i + ['total' => $i['quantity'] * $i['unit_cost']]);
                $this->stock->adjust($i['product_id'], $i['variant_id'] ?? null, $i['quantity'], 'purchase', 'PUR-'.$p->id);
                if ($v['update_cost'] ?? true) {
                    ! empty($i['variant_id'])
                        ? ProductVariant::whereKey($i['variant_id'])->update(['cost_price' => $i['unit_cost']])
                        : Product::whereKey($i['product_id'])->update(['cost_price' => $i['unit_cost']]);
                }
            }

            return $p;
        });
        ActivityLog::record('purchase.created', $purchase);

        return response()->json(['data' => $purchase->load('supplier:id,name', 'items.product:id,name')], 201);
    }

    public function show(int $id)
    {
        return response()->json(['data' => Purchase::with('supplier', 'items.product:id,name')->findOrFail($id)]);
    }

    public function update(Request $request, int $id)
    {
        $p = Purchase::findOrFail($id);
        $p->update($request->validate(['paid' => 'nullable|integer|min:0', 'note' => 'nullable|string|max:500']));

        return response()->json(['data' => $p]);
    }

    public function movements(Request $request)
    {
        $page = StockMovement::with(['product:id,name', 'variant:id,name'])
            ->when($request->query('product_id'), fn ($q, $id) => $q->where('product_id', $id))
            ->when($request->query('type'), fn ($q, $t) => $q->where('type', $t))
            ->latest('id')->paginate(30);

        return response()->json([
            'data' => $page->items(),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total()],
        ]);
    }

    public function adjust(Request $request)
    {
        $v = $request->validate([
            'product_id' => 'required|integer|exists:products,id', 'variant_id' => 'nullable|integer|exists:product_variants,id',
            'quantity' => 'required|integer|not_in:0', 'note' => 'nullable|string|max:255',
        ]);
        $this->stock->adjust($v['product_id'], $v['variant_id'] ?? null, $v['quantity'], 'adjustment', null, $v['note'] ?? 'Manual adjustment');

        return response()->json(['message' => 'Stock updated']);
    }
}
