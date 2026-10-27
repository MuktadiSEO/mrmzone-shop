<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Admin access guard. Usage: ->middleware('staff') for any staff role,
 * or ->middleware('staff:admin,manager') to restrict to specific roles.
 */
class EnsureStaff
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        if (! $user || ! $user->isStaff() || ! $user->is_active) {
            return response()->json(['message' => 'এই পেজে প্রবেশের অনুমতি নেই।'], 403);
        }
        if ($roles && ! in_array($user->role, $roles, true)) {
            return response()->json(['message' => 'এই কাজের অনুমতি আপনার নেই।'], 403);
        }

        return $next($request);
    }
}
