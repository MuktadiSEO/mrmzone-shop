<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Page;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class PageController extends CrudController
{
    protected string $model = Page::class;

    protected array $search = ['title', 'slug'];

    protected function rules(Request $request, ?Model $item = null): array
    {
        return [
            'title' => 'required|string|max:150',
            'slug' => 'nullable|string|max:150|unique:pages,slug'.($item ? ','.$item->id : ''),
            'content' => 'nullable|string',
            'is_active' => 'boolean',
        ];
    }
}
