<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Expense;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class ExpenseController extends CrudController
{
    protected string $model = Expense::class;

    protected array $search = ['category', 'note'];

    protected string $orderBy = 'date';

    public const CATEGORIES = ['Facebook Ads', 'Packaging', 'Courier', 'Product Purchase', 'Salary', 'Rent', 'Internet & Software', 'Transport', 'Others'];

    protected function query(Request $request): Builder
    {
        return Expense::query()
            ->when($request->query('from'), fn ($q, $d) => $q->whereDate('date', '>=', $d))
            ->when($request->query('to'), fn ($q, $d) => $q->whereDate('date', '<=', $d))
            ->when($request->query('category'), fn ($q, $c) => $q->where('category', $c));
    }

    protected function rules(Request $request, ?Model $item = null): array
    {
        return [
            'category' => 'required|string|max:60',
            'amount' => 'required|integer|min:1',
            'date' => 'required|date',
            'note' => 'nullable|string|max:255',
        ];
    }

    protected function prepare(array $data, Request $request, ?Model $item = null): array
    {
        return $data + ['user_id' => $request->user()->id];
    }
}
