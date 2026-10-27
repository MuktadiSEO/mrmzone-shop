<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Http\Resources\ProductCardResource;
use App\Models\Order;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private function userPayload(User $u): array
    {
        return $u->only('id', 'name', 'phone', 'email', 'role');
    }

    public function register(Request $request)
    {
        $v = $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:150|unique:users,email',
            'password' => 'required|string|min:6|max:100',
            'device_name' => 'nullable|string|max:60',
        ]);
        $phone = OrderService::normalizePhone($v['phone']);
        if (! preg_match('/^01[3-9]\d{8}$/', $phone)) {
            throw ValidationException::withMessages(['phone' => 'সঠিক মোবাইল নম্বর দিন।']);
        }
        if (User::where('phone', $phone)->exists()) {
            throw ValidationException::withMessages(['phone' => 'এই নম্বরে আগেই অ্যাকাউন্ট আছে।']);
        }
        $user = User::create(['name' => $v['name'], 'phone' => $phone, 'email' => $v['email'] ?? null, 'password' => $v['password'], 'role' => 'customer']);
        Order::whereNull('user_id')->where('phone', $phone)->update(['user_id' => $user->id]);

        return response()->json(['token' => $user->createToken($v['device_name'] ?? 'web')->plainTextToken, 'user' => $this->userPayload($user)], 201);
    }

    public function login(Request $request)
    {
        $v = $request->validate(['login' => 'required|string|max:150', 'password' => 'required|string', 'device_name' => 'nullable|string|max:60']);
        $login = trim($v['login']);
        $user = str_contains($login, '@')
            ? User::where('email', $login)->first()
            : User::where('phone', OrderService::normalizePhone($login))->first();
        if (! $user || ! Hash::check($v['password'], $user->password) || ! $user->is_active) {
            throw ValidationException::withMessages(['login' => 'মোবাইল/ইমেইল বা পাসওয়ার্ড সঠিক নয়।']);
        }

        return response()->json(['token' => $user->createToken($v['device_name'] ?? 'web')->plainTextToken, 'user' => $this->userPayload($user)]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        $u = $request->user();
        $last = Order::where('user_id', $u->id)->latest('id')->first();

        return response()->json(['data' => $this->userPayload($u) + [
            'addresses' => $last ? [['name' => $last->customer_name, 'phone' => $last->phone, 'address' => $last->address, 'district' => $last->district, 'delivery_area' => $last->delivery_area]] : [],
        ]]);
    }

    public function updateMe(Request $request)
    {
        $u = $request->user();
        $v = $request->validate([
            'name' => 'sometimes|string|max:100',
            'email' => 'sometimes|nullable|email|max:150|unique:users,email,'.$u->id,
            'password' => 'sometimes|nullable|string|min:6|max:100',
            'current_password' => 'required_with:password|nullable|string',
        ]);
        if (! empty($v['password']) && ! Hash::check($v['current_password'] ?? '', $u->password)) {
            throw ValidationException::withMessages(['current_password' => 'বর্তমান পাসওয়ার্ড সঠিক নয়।']);
        }
        unset($v['current_password']);
        if (empty($v['password'])) {
            unset($v['password']);
        }
        $u->update($v);

        return response()->json(['data' => $this->userPayload($u)]);
    }

    public function orders(Request $request)
    {
        $u = $request->user();

        return OrderResource::collection(
            Order::with('items')->where(fn ($q) => $q->where('user_id', $u->id)->orWhere('phone', $u->phone ?? '-'))->latest('id')->paginate(10)
        );
    }

    public function wishlist(Request $request)
    {
        $ids = $request->user()->wishlist()->pluck('products.id');

        return ProductCardResource::collection(CatalogController::productQuery()->whereIn('id', $ids)->get());
    }

    public function addWishlist(Request $request, int $productId)
    {
        $request->user()->wishlist()->syncWithoutDetaching([$productId]);

        return response()->json(['message' => 'Added']);
    }

    public function removeWishlist(Request $request, int $productId)
    {
        $request->user()->wishlist()->detach($productId);

        return response()->json(['message' => 'Removed']);
    }
}
