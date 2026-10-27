<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\ActivityLog;
use App\Models\Product;
use App\Services\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function __construct(private StockService $stock) {}

    private function rules(?Product $p = null): array
    {
        return [
            'name' => 'required|string|max:200',
            'slug' => 'nullable|string|max:200|unique:products,slug'.($p ? ','.$p->id : ''),
            'sku' => 'nullable|string|max:60|unique:products,sku'.($p ? ','.$p->id : ''),
            'category_id' => 'nullable|integer|exists:categories,id',
            'brand_id' => 'nullable|integer|exists:brands,id',
            'short_description' => 'nullable|string|max:500',
            'description' => 'nullable|string',
            'price' => 'required|integer|min:0',
            'sale_price' => 'nullable|integer|min:0',
            'cost_price' => 'nullable|integer|min:0',
            'stock' => 'nullable|integer',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'images' => 'nullable|array|max:12',
            'images.*' => 'string|max:500',
            'options' => 'nullable|array',
            'size_chart' => 'nullable|string',
            'video_url' => 'nullable|string|max:500',
            'badge' => 'nullable|string|max:40',
            'status' => 'nullable|in:active,draft',
            'is_featured' => 'boolean',
            'weight_grams' => 'nullable|integer|min:0',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'variants' => 'nullable|array|max:100',
            'variants.*.id' => 'nullable|integer',
            'variants.*.name' => 'nullable|string|max:120',
            'variants.*.attributes' => 'required_with:variants|array',
            'variants.*.sku' => 'nullable|string|max:60',
            'variants.*.price' => 'nullable|integer|min:0',
            'variants.*.cost_price' => 'nullable|integer|min:0',
            'variants.*.stock' => 'nullable|integer',
        ];
    }

    public function index(Request $request)
    {
        $q = Product::with(['category:id,name,slug', 'variants'])->withCount('reviews');
        if ($s = $request->query('search')) {
            $q->where(fn ($w) => $w->where('name', 'like', "%$s%")->orWhere('sku', 'like', "%$s%"));
        }
        $q->when($request->query('category_id'), fn ($w, $c) => $w->where('category_id', $c))
            ->when($request->query('status'), fn ($w, $s) => $w->where('status', $s))
            ->when($request->query('stock') === 'low', fn ($w) => $w->whereColumn('stock', '<=', 'low_stock_threshold'))
            ->when($request->query('stock') === 'out', fn ($w) => $w->where('stock', '<=', 0));
        $page = $q->latest('id')->paginate(min((int) $request->query('per_page', 20), 100));

        return response()->json([
            'data' => collect($page->items())->map(fn ($p) => (new ProductResource($p))->asAdmin()->resolve($request)),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total()],
        ]);
    }

    public function show(Request $request, int $id)
    {
        $p = Product::with(['category', 'brand', 'variants'])->findOrFail($id);

        return response()->json(['data' => (new ProductResource($p))->asAdmin()->resolve($request)]);
    }

    public function store(Request $request)
    {
        $v = $request->validate($this->rules());
        $product = DB::transaction(function () use ($v) {
            $variants = $v['variants'] ?? [];
            $openingStock = (int) ($v['stock'] ?? 0);
            unset($v['variants']);
            $v['stock'] = 0;
            $v['status'] ??= 'active';
            $v['cost_price'] ??= 0;
            $p = Product::create($v);
            $this->syncVariants($p, $variants);
            if (! $variants && $openingStock !== 0) {
                $this->stock->adjust($p->id, null, $openingStock, 'opening', null, 'Opening stock');
            }

            return $p;
        });
        ActivityLog::record('created', $product);

        return $this->show($request, $product->id)->setStatusCode(201);
    }

    public function update(Request $request, int $id)
    {
        $product = Product::findOrFail($id);
        $v = $request->validate($this->rules($product));
        DB::transaction(function () use ($product, $v) {
            $variants = $v['variants'] ?? null;
            $newStock = array_key_exists('stock', $v) ? (int) $v['stock'] : null;
            unset($v['variants'], $v['stock']);
            $product->update($v);
            if ($variants !== null) {
                $this->syncVariants($product, $variants);
            }
            if ($newStock !== null && ! $product->variants()->exists() && $newStock !== $product->stock) {
                $this->stock->adjust($product->id, null, $newStock - $product->stock, 'adjustment', null, 'Manual stock edit');
            }
        });
        ActivityLog::record('updated', $product);

        return $this->show($request, $product->id);
    }

    public function destroy(int $id)
    {
        $p = Product::findOrFail($id);
        $p->delete();
        ActivityLog::record('deleted', $p);

        return response()->json(['message' => 'Deleted']);
    }

    private function syncVariants(Product $p, array $variants): void
    {
        $keep = [];
        foreach ($variants as $row) {
            $attrs = $row['attributes'] ?? [];
            $name = $row['name'] ?? implode(' / ', array_values($attrs));
            $variant = ! empty($row['id']) ? $p->variants()->find($row['id']) : null;
            $targetStock = (int) ($row['stock'] ?? 0);
            if ($variant) {
                $diff = $targetStock - $variant->stock;
                $variant->update(['name' => $name, 'attributes' => $attrs, 'sku' => $row['sku'] ?? null, 'price' => $row['price'] ?? null, 'cost_price' => $row['cost_price'] ?? null]);
                if ($diff !== 0) {
                    $this->stock->adjust($p->id, $variant->id, $diff, 'adjustment', null, 'Manual stock edit');
                }
            } else {
                $variant = $p->variants()->create(['name' => $name, 'attributes' => $attrs, 'sku' => $row['sku'] ?? null, 'price' => $row['price'] ?? null, 'cost_price' => $row['cost_price'] ?? null, 'stock' => 0]);
                if ($targetStock !== 0) {
                    $this->stock->adjust($p->id, $variant->id, $targetStock, 'opening', null, 'Opening stock');
                }
            }
            $keep[] = $variant->id;
        }
        $p->variants()->whereNotIn('id', $keep)->delete();
        if ($keep) {
            $p->update(['stock' => (int) $p->variants()->sum('stock')]);
        }
    }
}
