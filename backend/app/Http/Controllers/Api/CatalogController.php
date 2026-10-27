<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductCardResource;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public static function productQuery(): Builder
    {
        return Product::active()
            ->with(['category:id,name,slug', 'variants'])
            ->withCount(['reviews' => fn ($q) => $q->where('is_approved', true)])
            ->withAvg(['reviews' => fn ($q) => $q->where('is_approved', true)], 'rating');
    }

    public function categories()
    {
        $cats = Category::where('is_active', true)->whereNull('parent_id')
            ->with(['children' => fn ($q) => $q->where('is_active', true)->withCount(['products' => fn ($p) => $p->active()])])
            ->withCount(['products' => fn ($p) => $p->active()])
            ->orderBy('sort_order')->get();

        return CategoryResource::collection($cats);
    }

    public function category(string $slug)
    {
        $cat = Category::where('slug', $slug)->where('is_active', true)
            ->with(['children' => fn ($q) => $q->where('is_active', true)])
            ->withCount(['products' => fn ($p) => $p->active()])->firstOrFail();

        return new CategoryResource($cat);
    }

    public function products(Request $request)
    {
        $v = $request->validate([
            'category' => 'nullable|string', 'search' => 'nullable|string|max:100', 'brand' => 'nullable|string',
            'sort' => 'nullable|in:latest,price_asc,price_desc,popular', 'min_price' => 'nullable|integer|min:0',
            'max_price' => 'nullable|integer|min:0', 'per_page' => 'nullable|integer|min:1|max:60', 'featured' => 'nullable|boolean',
        ]);
        $q = self::productQuery();
        if (! empty($v['category'])) {
            $cat = Category::where('slug', $v['category'])->first();
            $q->whereIn('category_id', $cat ? $cat->descendantIds() : [0]);
        }
        if (! empty($v['brand'])) {
            $q->whereHas('brand', fn ($b) => $b->where('slug', $v['brand']));
        }
        if (! empty($v['search'])) {
            $term = '%'.str_replace(['%', '_'], ['\%', '\_'], $v['search']).'%';
            $q->where(fn ($w) => $w->where('name', 'like', $term)->orWhere('sku', 'like', $term)->orWhere('short_description', 'like', $term));
        }
        if (! empty($v['featured'])) {
            $q->where('is_featured', true);
        }
        $priceExpr = 'COALESCE(NULLIF(sale_price, 0), price)';
        if (isset($v['min_price'])) {
            $q->whereRaw("$priceExpr >= ?", [$v['min_price']]);
        }
        if (isset($v['max_price'])) {
            $q->whereRaw("$priceExpr <= ?", [$v['max_price']]);
        }
        match ($v['sort'] ?? 'latest') {
            'price_asc' => $q->orderByRaw("$priceExpr asc"),
            'price_desc' => $q->orderByRaw("$priceExpr desc"),
            'popular' => $q->orderByDesc('sold_count'),
            default => $q->latest('id'),
        };

        return ProductCardResource::collection($q->paginate($v['per_page'] ?? 20)->withQueryString());
    }

    public function product(string $slug)
    {
        $product = self::productQuery()->with('brand')->where('slug', $slug)->firstOrFail();
        $related = self::productQuery()->where('id', '!=', $product->id)
            ->where('category_id', $product->category_id)->inRandomOrder()->limit(8)->get();

        return response()->json(['data' => array_merge((new ProductResource($product))->resolve(request()), [
            'related' => ProductCardResource::collection($related)->resolve(request()),
        ])]);
    }

    public function reviews(string $slug)
    {
        $product = Product::active()->where('slug', $slug)->firstOrFail();

        return Review::where('product_id', $product->id)->where('is_approved', true)->latest()
            ->select('id', 'name', 'rating', 'comment', 'created_at')->paginate(10);
    }

    public function storeReview(Request $request, string $slug)
    {
        $product = Product::active()->where('slug', $slug)->firstOrFail();
        $v = $request->validate([
            'name' => 'required|string|max:80', 'rating' => 'required|integer|min:1|max:5', 'comment' => 'nullable|string|max:1000',
        ]);
        $review = Review::create($v + ['product_id' => $product->id, 'user_id' => $request->user('sanctum')?->id, 'is_approved' => false]);

        return response()->json(['data' => $review->only('id', 'name', 'rating', 'comment'), 'message' => 'রিভিউ জমা হয়েছে। অনুমোদনের পর দেখা যাবে।'], 201);
    }
}
