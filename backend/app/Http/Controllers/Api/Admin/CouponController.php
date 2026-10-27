<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Coupon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class CouponController extends CrudController
{
    protected string $model = Coupon::class;

    protected array $search = ['code'];

    protected function rules(Request $request, ?Model $item = null): array
    {
        return [
            'code' => 'required|string|max:50|alpha_dash|unique:coupons,code'.($item ? ','.$item->id : ''),
            'type' => 'required|in:percent,fixed',
            'value' => 'required|integer|min:1',
            'min_order' => 'nullable|integer|min:0',
            'max_discount' => 'nullable|integer|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'starts_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after_or_equal:starts_at',
            'is_active' => 'boolean',
        ];
    }

    protected function prepare(array $data, Request $request, ?Model $item = null): array
    {
        $data['code'] = strtoupper($data['code']);
        $data['min_order'] = $data['min_order'] ?? 0;

        return $data;
    }
}
