<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Simple key/value store for shop settings (store info, delivery charges,
 * courier & SMS credentials, tracking ids, SMS templates).
 */
class Setting extends Model
{
    protected $guarded = ['id'];

    /** Keys that must never be exposed by the public /settings endpoint. */
    public const SECRET_KEYS = [
        'steadfast_api_key', 'steadfast_secret_key',
        'pathao_client_id', 'pathao_client_secret', 'pathao_username', 'pathao_password', 'pathao_store_id',
        'redx_token', 'redx_default_area_id', 'fraud_api_url', 'sms_api_key', 'sms_sender_id', 'sms_provider', 'fraud_api_key',
    ];

    public const DEFAULTS = [
        'store_name' => 'MRM Zone Shop',
        'store_tagline' => 'প্রয়োজনের সবকিছু, এক জায়গায়',
        'store_phone' => '01302919979',
        'store_whatsapp' => '8801302919979',
        'store_email' => '',
        'store_address' => 'Rajabari Bazar, Sreepur, Gazipur',
        'store_facebook' => 'https://facebook.com/mrmzoneshop',
        'store_logo' => '',
        'announcement' => 'সারা বাংলাদেশে ক্যাশ অন ডেলিভারি · ২টি পণ্য নিলে ডেলিভারি চার্জ ফ্রি',
        'delivery_inside_dhaka' => '70',
        'delivery_outside_dhaka' => '130',
        'free_delivery_min_qty' => '2',
        'payment_methods' => 'cod',
        'meta_pixel_id' => '',
        'meta_capi_token' => '',
        'gtm_id' => '',
        'default_courier' => 'steadfast',
        'steadfast_api_key' => '',
        'steadfast_secret_key' => '',
        'pathao_base_url' => 'https://api-hermes.pathao.com',
        'pathao_client_id' => '',
        'pathao_client_secret' => '',
        'pathao_username' => '',
        'pathao_password' => '',
        'pathao_store_id' => '',
        'redx_token' => '',
        'redx_default_area_id' => '',
        'fraud_api_key' => '',
        'fraud_api_url' => 'https://bdcourier.com/api/courier-check',
        'sms_provider' => 'bulksmsbd',
        'sms_api_key' => '',
        'sms_sender_id' => '',
        'sms_on_order_placed' => '1',
        'sms_on_order_confirmed' => '0',
        'sms_on_order_shipped' => '1',
        'sms_template_placed' => 'প্রিয় {name}, আপনার অর্ডার {number} গ্রহণ করা হয়েছে। মোট: ৳{total}। ধন্যবাদ - MRM Zone Shop',
        'sms_template_confirmed' => 'প্রিয় {name}, আপনার অর্ডার {number} কনফার্ম করা হয়েছে। শীঘ্রই পাঠানো হবে। - MRM Zone Shop',
        'sms_template_shipped' => 'আপনার অর্ডার {number} কুরিয়ারে দেওয়া হয়েছে। ট্র্যাকিং: {tracking}। - MRM Zone Shop',
        'low_stock_threshold' => '5',
    ];

    public static function all_values(): array
    {
        return Cache::rememberForever('settings.all', function () {
            $stored = static::query()->pluck('value', 'key')->all();

            return array_merge(self::DEFAULTS, array_filter($stored, fn ($v) => $v !== null));
        });
    }

    public static function get(string $key, $default = null)
    {
        return self::all_values()[$key] ?? $default;
    }

    public static function put(array $values): void
    {
        foreach ($values as $key => $value) {
            static::updateOrCreate(['key' => $key], ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) ($value ?? '')]);
        }
        Cache::forget('settings.all');
    }

    public static function publicValues(): array
    {
        return array_diff_key(self::all_values(), array_flip(self::SECRET_KEYS), ['meta_capi_token' => 1]);
    }
}
