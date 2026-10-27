<?php

namespace App\Models;

use App\Models\Concerns\HasSlug;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasSlug;

    protected $guarded = ['id'];

    protected $casts = ['is_active' => 'boolean', 'is_featured' => 'boolean'];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id')->orderBy('sort_order');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /** IDs of this category and all its descendants (two levels is plenty for a shop). */
    public function descendantIds(): array
    {
        $ids = [$this->id];
        $children = Category::where('parent_id', $this->id)->pluck('id')->all();
        $ids = array_merge($ids, $children);
        if ($children) {
            $ids = array_merge($ids, Category::whereIn('parent_id', $children)->pluck('id')->all());
        }

        return array_values(array_unique($ids));
    }
}
