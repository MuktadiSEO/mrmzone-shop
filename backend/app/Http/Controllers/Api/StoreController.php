<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductCardResource;
use App\Http\Resources\ProductResource;
use App\Models\Banner;
use App\Models\Category;
use App\Models\LandingPage;
use App\Models\Page;
use App\Models\Setting;

class StoreController extends Controller
{
    public function settings()
    {
        $s = Setting::publicValues();

        return response()->json([
            'name' => $s['store_name'],
            'tagline' => $s['store_tagline'],
            'logo' => $s['store_logo'] ?: null,
            'phone' => $s['store_phone'],
            'whatsapp' => $s['store_whatsapp'],
            'email' => $s['store_email'] ?: null,
            'address' => $s['store_address'],
            'facebook' => $s['store_facebook'],
            'announcement' => $s['announcement'],
            'delivery' => [
                'inside_dhaka' => (int) $s['delivery_inside_dhaka'],
                'outside_dhaka' => (int) $s['delivery_outside_dhaka'],
                'free_delivery_min_qty' => (int) $s['free_delivery_min_qty'],
            ],
            'payment_methods' => array_values(array_filter(explode(',', $s['payment_methods']))),
            'meta_pixel_id' => $s['meta_pixel_id'] ?: null,
            'gtm_id' => $s['gtm_id'] ?: null,
        ]);
    }

    public function home()
    {
        $banners = Banner::where('is_active', true)->orderBy('sort_order')->get(['id', 'title', 'subtitle', 'image', 'link', 'button_text', 'position']);
        $categories = Category::where('is_active', true)->where('is_featured', true)->whereNull('parent_id')
            ->withCount(['products' => fn ($p) => $p->active()])->orderBy('sort_order')->get();
        $sections = [
            ['title' => 'নতুন পণ্য', 'slug' => 'new-arrivals', 'products' => CatalogController::productQuery()->latest('id')->limit(10)->get()],
            ['title' => 'সবচেয়ে বেশি বিক্রিত', 'slug' => 'best-sellers', 'products' => CatalogController::productQuery()->orderByDesc('sold_count')->orderByDesc('is_featured')->limit(10)->get()],
            ['title' => 'বিশেষ ছাড়', 'slug' => 'deals', 'products' => CatalogController::productQuery()->whereNotNull('sale_price')->whereColumn('sale_price', '<', 'price')->latest('id')->limit(10)->get()],
            ['title' => 'ফিচারড', 'slug' => 'featured', 'products' => CatalogController::productQuery()->where('is_featured', true)->latest('id')->limit(10)->get()],
        ];

        return response()->json([
            'banners' => $banners,
            'categories' => CategoryResource::collection($categories)->resolve(request()),
            'sections' => array_values(array_filter(array_map(fn ($s) => [
                'title' => $s['title'], 'slug' => $s['slug'],
                'products' => ProductCardResource::collection($s['products'])->resolve(request()),
            ], $sections), fn ($s) => count($s['products']) > 0)),
        ]);
    }

    public function page(string $slug)
    {
        $page = Page::where('slug', $slug)->where('is_active', true)->firstOrFail();

        return response()->json(['data' => $page->only('title', 'slug', 'content', 'updated_at')]);
    }

    public function landingPage(string $slug)
    {
        $lp = LandingPage::where('slug', $slug)->where('is_active', true)->firstOrFail();
        $lp->increment('views');
        $product = $lp->product_id ? CatalogController::productQuery()->with('brand')->find($lp->product_id) : null;

        return response()->json(['data' => [
            'id' => $lp->id,
            'title' => $lp->title,
            'slug' => $lp->slug,
            'headline' => $lp->headline,
            'subheadline' => $lp->subheadline,
            'hero_image' => $lp->hero_image,
            'video_url' => $lp->video_url,
            'offer_text' => $lp->offer_text,
            'theme_color' => $lp->theme_color,
            'sections' => $lp->sections ?? [],
            'product' => $product ? (new ProductResource($product))->resolve(request()) : null,
        ]]);
    }
}
