<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class CategoryController extends CrudController
{
    protected string $model = Category::class;

    protected string $orderBy = 'sort_order';

    protected string $orderDir = 'asc';

    protected function query(Request $request): Builder
    {
        return Category::query()->withCount('products')->with('parent:id,name');
    }

    protected function transform(Model $item): array
    {
        return (new CategoryResource($item))->resolve(request()) + ['parent' => $item->parent?->only('id', 'name')];
    }

    protected function rules(Request $request, ?Model $item = null): array
    {
        return [
            'name' => 'required|string|max:100',
            'slug' => 'nullable|string|max:120|unique:categories,slug'.($item ? ','.$item->id : ''),
            'parent_id' => 'nullable|integer|exists:categories,id'.($item ? '|not_in:'.$item->id : ''),
            'icon' => 'nullable|string|max:30',
            'image' => 'nullable|string|max:500',
            'description' => 'nullable|string|max:1000',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }
}
