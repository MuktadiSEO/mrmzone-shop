<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class SupplierController extends CrudController
{
    protected string $model = Supplier::class;

    protected array $search = ['name', 'phone'];

    protected function query(Request $request): Builder
    {
        return Supplier::query()->withSum('purchases as purchases_total', 'total')->withSum('purchases as paid_total', 'paid');
    }

    protected function transform(Model $item): array
    {
        return $item->toArray() + ['due' => (int) ($item->purchases_total ?? 0) - (int) ($item->paid_total ?? 0)];
    }

    protected function rules(Request $request, ?Model $item = null): array
    {
        return [
            'name' => 'required|string|max:120',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'note' => 'nullable|string|max:1000',
        ];
    }
}
