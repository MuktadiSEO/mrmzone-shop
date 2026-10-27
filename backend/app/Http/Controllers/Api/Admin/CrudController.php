<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/**
 * Generic admin CRUD for simple tables. Subclasses declare the model,
 * validation rules, searchable columns and default ordering.
 */
abstract class CrudController extends Controller
{
    /** @var class-string<Model> */
    protected string $model;

    protected array $search = ['name'];

    protected string $orderBy = 'id';

    protected string $orderDir = 'desc';

    protected array $with = [];

    abstract protected function rules(Request $request, ?Model $item = null): array;

    protected function query(Request $request): Builder
    {
        return $this->model::query()->with($this->with);
    }

    protected function transform(Model $item): array
    {
        return $item->toArray();
    }

    protected function prepare(array $data, Request $request, ?Model $item = null): array
    {
        return $data;
    }

    public function index(Request $request)
    {
        $q = $this->query($request);
        if ($s = $request->query('search')) {
            $q->where(function ($w) use ($s) {
                foreach ($this->search as $col) {
                    $w->orWhere($col, 'like', '%'.$s.'%');
                }
            });
        }
        $q->orderBy($this->orderBy, $this->orderDir);
        if ($request->boolean('all')) {
            return response()->json(['data' => $q->limit(500)->get()->map(fn ($i) => $this->transform($i))]);
        }
        $page = $q->paginate(min((int) $request->query('per_page', 20), 100));

        return response()->json([
            'data' => collect($page->items())->map(fn ($i) => $this->transform($i)),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total()],
        ]);
    }

    public function show(int $id)
    {
        return response()->json(['data' => $this->transform($this->model::with($this->with)->findOrFail($id))]);
    }

    public function store(Request $request)
    {
        $data = $this->prepare($request->validate($this->rules($request)), $request);
        $item = $this->model::create($data);
        $this->afterSave($item, $request);
        ActivityLog::record('created', $item);

        return response()->json(['data' => $this->transform($item->refresh()->load($this->with))], 201);
    }

    public function update(Request $request, int $id)
    {
        $item = $this->model::findOrFail($id);
        $data = $this->prepare($request->validate($this->rules($request, $item)), $request, $item);
        $item->update($data);
        $this->afterSave($item, $request);
        ActivityLog::record('updated', $item);

        return response()->json(['data' => $this->transform($item->refresh()->load($this->with))]);
    }

    public function destroy(int $id)
    {
        $item = $this->model::findOrFail($id);
        $item->delete();
        ActivityLog::record('deleted', $item);

        return response()->json(['message' => 'Deleted']);
    }

    protected function afterSave(Model $item, Request $request): void {}
}
