<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

/** Full product detail (storefront) — admin fields are added when requested by staff. */
class ProductResource extends ProductCardResource
{
    public bool $admin = false;

    public function asAdmin(): static
    {
        $this->admin = true;

        return $this;
    }

    public function toArray(Request $request): array
    {
        $data = parent::toArray($request) + [
            'sku' => $this->sku,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'images' => $this->images ?? [],
            'stock' => $this->total_stock,
            'variants' => $this->variants->map(fn ($v) => [
                'id' => $v->id,
                'name' => $v->name,
                'attributes' => $v->attributes,
                'price' => $v->price ?: $this->final_price,
                'stock' => $v->stock,
                'sku' => $v->sku,
            ] + ($this->admin ? ['cost_price' => $v->cost_price, 'raw_price' => $v->price] : []))->values(),
            'options' => $this->options ?: $this->deriveOptions(),
            'size_chart' => $this->size_chart,
            'video_url' => $this->video_url,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'brand' => $this->whenLoaded('brand', fn () => $this->brand ? ['id' => $this->brand->id, 'name' => $this->brand->name, 'slug' => $this->brand->slug] : null),
        ];
        if ($this->admin) {
            $data += [
                'cost_price' => $this->cost_price,
                'status' => $this->status,
                'is_featured' => $this->is_featured,
                'category_id' => $this->category_id,
                'brand_id' => $this->brand_id,
                'low_stock_threshold' => $this->low_stock_threshold,
                'weight_grams' => $this->weight_grams,
                'sold_count' => $this->sold_count,
                'created_at' => $this->created_at,
            ];
        }

        return $data;
    }

    private function deriveOptions(): array
    {
        $opts = [];
        foreach ($this->variants as $v) {
            foreach ((array) $v->attributes as $k => $val) {
                $opts[$k] ??= [];
                if (! in_array($val, $opts[$k], true)) {
                    $opts[$k][] = $val;
                }
            }
        }

        return $opts;
    }
}
