<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class StaffController extends CrudController
{
    protected string $model = User::class;

    protected array $search = ['name', 'email', 'phone'];

    protected function query(Request $request): Builder
    {
        return User::where('role', '!=', 'customer');
    }

    protected function transform(Model $item): array
    {
        return $item->only('id', 'name', 'email', 'phone', 'role', 'is_active', 'created_at');
    }

    protected function rules(Request $request, ?Model $item = null): array
    {
        return [
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:users,email'.($item ? ','.$item->id : ''),
            'phone' => 'nullable|string|max:20|unique:users,phone'.($item ? ','.$item->id : ''),
            'role' => 'required|in:staff,manager,admin',
            'password' => ($item ? 'nullable' : 'required').'|string|min:8|max:100',
            'is_active' => 'boolean',
        ];
    }

    protected function prepare(array $data, Request $request, ?Model $item = null): array
    {
        if (empty($data['password'])) {
            unset($data['password']);
        }
        if ($item && $item->id === $request->user()->id) {
            unset($data['role'], $data['is_active']); // can't demote/disable yourself
        }

        return $data;
    }

    public function destroy(int $id)
    {
        if ($id === request()->user()->id) {
            return response()->json(['message' => 'নিজের অ্যাকাউন্ট মুছতে পারবেন না।'], 422);
        }
        User::where('role', '!=', 'customer')->findOrFail($id)->tokens()->delete();

        return parent::destroy($id);
    }
}
