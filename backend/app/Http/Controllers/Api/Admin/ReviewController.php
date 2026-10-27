<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Review;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class ReviewController extends CrudController
{
    protected string $model = Review::class;

    protected array $search = ['name', 'comment'];

    protected array $with = ['product:id,name,slug'];

    protected function query(Request $request): Builder
    {
        return Review::with($this->with)->when($request->has('approved'), fn ($q) => $q->where('is_approved', $request->boolean('approved')));
    }

    protected function rules(Request $request, ?Model $item = null): array
    {
        return [
            'product_id' => ($item ? 'sometimes' : 'required').'|integer|exists:products,id',
            'name' => ($item ? 'sometimes' : 'required').'|string|max:80',
            'rating' => ($item ? 'sometimes' : 'required').'|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
            'is_approved' => 'boolean',
        ];
    }
}
