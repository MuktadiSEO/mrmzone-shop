<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

/**
 * Settings are stored flat (key/value) but the admin panel works with a nested shape:
 * { store, delivery, courier: {default, steadfast, pathao, redx}, sms, tracking, fraud, sms_templates }.
 */
class SettingController extends Controller
{
    /** nested.path => flat key */
    public const MAP = [
        'store.name' => 'store_name', 'store.tagline' => 'store_tagline', 'store.phone' => 'store_phone',
        'store.whatsapp' => 'store_whatsapp', 'store.email' => 'store_email', 'store.address' => 'store_address',
        'store.facebook' => 'store_facebook', 'store.logo' => 'store_logo', 'store.announcement' => 'announcement',
        'delivery.inside_dhaka' => 'delivery_inside_dhaka', 'delivery.outside_dhaka' => 'delivery_outside_dhaka',
        'delivery.free_delivery_min_qty' => 'free_delivery_min_qty',
        'courier.default' => 'default_courier',
        'courier.steadfast.api_key' => 'steadfast_api_key', 'courier.steadfast.secret_key' => 'steadfast_secret_key',
        'courier.pathao.base_url' => 'pathao_base_url', 'courier.pathao.client_id' => 'pathao_client_id',
        'courier.pathao.client_secret' => 'pathao_client_secret', 'courier.pathao.username' => 'pathao_username',
        'courier.pathao.password' => 'pathao_password', 'courier.pathao.store_id' => 'pathao_store_id',
        'courier.redx.token' => 'redx_token', 'courier.redx.default_area_id' => 'redx_default_area_id',
        'sms.provider' => 'sms_provider', 'sms.api_key' => 'sms_api_key', 'sms.sender_id' => 'sms_sender_id',
        'tracking.meta_pixel_id' => 'meta_pixel_id', 'tracking.gtm_id' => 'gtm_id',
        'fraud.api_key' => 'fraud_api_key', 'fraud.api_url' => 'fraud_api_url',
        'sms_templates.order_placed' => 'sms_template_placed', 'sms_templates.order_confirmed' => 'sms_template_confirmed',
        'sms_templates.order_shipped' => 'sms_template_shipped',
        'sms_templates.enabled.order_placed' => 'sms_on_order_placed', 'sms_templates.enabled.order_confirmed' => 'sms_on_order_confirmed',
        'sms_templates.enabled.order_shipped' => 'sms_on_order_shipped',
        'inventory.low_stock_threshold' => 'low_stock_threshold',
    ];

    private const NUMERIC = ['delivery_inside_dhaka', 'delivery_outside_dhaka', 'free_delivery_min_qty', 'low_stock_threshold'];

    private const BOOLEAN = ['sms_on_order_placed', 'sms_on_order_confirmed', 'sms_on_order_shipped'];

    public static function nested(): array
    {
        $flat = Setting::all_values();
        $out = [];
        foreach (self::MAP as $path => $key) {
            $v = $flat[$key] ?? null;
            if (in_array($key, self::NUMERIC, true)) {
                $v = (int) $v;
            } elseif (in_array($key, self::BOOLEAN, true)) {
                $v = $v === '1';
            }
            Arr::set($out, $path, $v);
        }

        return $out;
    }

    public function index()
    {
        return response()->json(['data' => self::nested()]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'delivery.inside_dhaka' => 'nullable|integer|min:0',
            'delivery.outside_dhaka' => 'nullable|integer|min:0',
            'delivery.free_delivery_min_qty' => 'nullable|integer|min:0',
            'store.email' => 'nullable|email',
            'courier.default' => 'nullable|in:steadfast,pathao,redx',
            'sms.provider' => 'nullable|in:log,bulksmsbd',
            'courier.pathao.base_url' => 'nullable|url',
        ]);
        $values = [];
        foreach (self::MAP as $path => $key) {
            if (Arr::has($request->all(), $path)) {
                $values[$key] = Arr::get($request->all(), $path);
            }
        }
        // Also accept the flat keys directly (handy for scripts / future clients).
        $values += array_intersect_key($request->all(), Setting::DEFAULTS);
        Setting::put($values);
        ActivityLog::record('settings.updated', null, ['keys' => array_keys($values)]);

        return response()->json(['data' => self::nested(), 'message' => 'সেটিংস সংরক্ষণ হয়েছে।']);
    }
}
