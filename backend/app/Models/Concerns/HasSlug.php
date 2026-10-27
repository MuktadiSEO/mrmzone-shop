<?php

namespace App\Models\Concerns;

use Illuminate\Support\Str;

/**
 * Generates a unique, URL-safe slug from `name` (or `title`) when none is given.
 * Bangla names transliterate poorly, so we fall back to a short random slug.
 */
trait HasSlug
{
    protected static function bootHasSlug(): void
    {
        static::saving(function ($model) {
            if (! empty($model->slug)) {
                $model->slug = Str::slug($model->slug) ?: $model->slug;

                return;
            }
            $source = $model->name ?? $model->title ?? '';
            $base = Str::slug($source);
            if ($base === '') {
                $base = Str::lower(Str::random(8));
            }
            $slug = $base;
            $i = 2;
            while (static::where('slug', $slug)->when($model->exists, fn ($q) => $q->where('id', '!=', $model->id))->exists()) {
                $slug = $base.'-'.$i++;
            }
            $model->slug = $slug;
        });
    }
}
