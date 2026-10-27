<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Setting::all_values()]);
    }

    public function update(Request $request)
    {
        $allowed = array_keys(Setting::DEFAULTS);
        $values = array_intersect_key($request->all(), array_flip($allowed));
        $request->validate([
            'delivery_inside_dhaka' => 'nullable|integer|min:0',
            'delivery_outside_dhaka' => 'nullable|integer|min:0',
            'free_delivery_min_qty' => 'nullable|integer|min:0',
            'store_email' => 'nullable|email',
            'default_courier' => 'nullable|in:steadfast,pathao,redx',
            'sms_provider' => 'nullable|in:log,bulksmsbd',
        ]);
        Setting::put($values);
        ActivityLog::record('settings.updated', null, ['keys' => array_keys($values)]);

        return response()->json(['data' => Setting::all_values(), 'message' => 'সেটিংস সংরক্ষণ হয়েছে।']);
    }
}
