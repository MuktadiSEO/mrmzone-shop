<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Banner;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class BannerController extends CrudController
{
    protected string $model = Banner::class;

    protected array $search = ['title'];

    protected string $orderBy = 'sort_order';

    protected string $orderDir = 'asc';

    protected function rules(Request $request, ?Model $item = null): array
    {
        return [
            'title' => 'nullable|string|max:150',
            'subtitle' => 'nullable|string|max:250',
            'image' => ($item ? 'sometimes|' : '').'required|string|max:500',
            'link' => 'nullable|string|max:500',
            'button_text' => 'nullable|string|max:50',
            'position' => 'nullable|in:hero,side,promo',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
        ];
    }
}
