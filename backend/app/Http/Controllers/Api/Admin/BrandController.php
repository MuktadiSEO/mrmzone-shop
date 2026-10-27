<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Brand;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class BrandController extends CrudController
{
    protected string $model = Brand::class;

    protected string $orderBy = 'name';

    protected string $orderDir = 'asc';

    protected function rules(Request $request, ?Model $item = null): array
    {
        return [
            'name' => 'required|string|max:100',
            'slug' => 'nullable|string|max:120|unique:brands,slug'.($item ? ','.$item->id : ''),
            'logo' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ];
    }
}
