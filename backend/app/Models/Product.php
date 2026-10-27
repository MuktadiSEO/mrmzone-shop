<?php

namespace App\Models;

use App\Models\Concerns\HasSlug;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasSlug, SoftDeletes;

    protected $guarded = ['id'];

    protected $casts = [
        'images' => 'array',
        'options' => 'array',
        'is_featured' => 'boolean',
        'price' => 'integer',
        'sale_price' => 'integer',
        'cost_price' => 'integer',
        'stock' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function scopeActive(Builder $q): Builder
    {
        return $q->where('status', 'active');
    }

    public function getFinalPriceAttribute(): int
    {
        return ($this->sale_price && $this->sale_price < $this->price) ? $this->sale_price : $this->price;
    }

    public function getDiscountPercentAttribute(): int
    {
        if (! $this->sale_price || $this->sale_price >= $this->price || $this->price === 0) {
            return 0;
        }

        return (int) round(100 - ($this->sale_price / $this->price * 100));
    }

    public function getTotalStockAttribute(): int
    {
        if ($this->relationLoaded('variants') ? $this->variants->isNotEmpty() : $this->variants()->exists()) {
            return (int) $this->variants->sum('stock');
        }

        return (int) $this->stock;
    }

    public function getImageAttribute(): ?string
    {
        return $this->images[0] ?? null;
    }
}
