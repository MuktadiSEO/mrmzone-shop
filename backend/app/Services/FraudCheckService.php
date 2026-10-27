<?php

namespace App\Services;

use App\Models\Blacklist;
use App\Models\FraudCheck;
use App\Models\Order;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Customer delivery-risk check.
 *  - Always: this shop's own order history for the phone number.
 *  - Optional: courier-wide history from an external checker (e.g. bdcourier.com) when
 *    `fraud_api_key` is set. Results are cached for 24 hours per phone.
 */
class FraudCheckService
{
    public function check(string $phone, bool $fresh = false): array
    {
        $phone = OrderService::normalizePhone($phone);

        $local = Order::where('phone', $phone)->selectRaw("
            count(*) as orders,
            sum(case when status = 'delivered' then 1 else 0 end) as delivered,
            sum(case when status = 'cancelled' then 1 else 0 end) as cancelled,
            sum(case when status = 'returned' then 1 else 0 end) as returned
        ")->first();
        $local = [
            'orders' => (int) $local->orders,
            'delivered' => (int) $local->delivered,
            'cancelled' => (int) $local->cancelled,
            'returned' => (int) $local->returned,
        ];

        $couriers = $this->external($phone, $fresh);
        $total = array_sum(array_column($couriers, 'total')) + $local['delivered'] + $local['returned'];
        $delivered = array_sum(array_column($couriers, 'delivered')) + $local['delivered'];
        $cancelled = array_sum(array_column($couriers, 'cancelled')) + $local['returned'];
        $rate = $total > 0 ? round($delivered / $total * 100, 1) : null;

        $blacklisted = Blacklist::where('phone', $phone)->exists();
        $risk = match (true) {
            $blacklisted => 'high',
            $rate === null => 'unknown',
            $rate < 50 => 'high',
            $rate < 80 => 'medium',
            default => 'low',
        };

        return [
            'phone' => $phone,
            'total' => $total,
            'delivered' => $delivered,
            'cancelled' => $cancelled,
            'success_rate' => $rate,
            'risk' => $risk,
            'couriers' => $couriers,
            'local' => $local,
            'blacklisted' => $blacklisted,
            'external_enabled' => (bool) Setting::get('fraud_api_key'),
        ];
    }

    /** @return array<int, array{name:string,total:int,delivered:int,cancelled:int}> */
    private function external(string $phone, bool $fresh): array
    {
        $key = Setting::get('fraud_api_key');
        if (! $key) {
            return [];
        }
        $cached = FraudCheck::where('phone', $phone)->first();
        if (! $fresh && $cached && $cached->updated_at->gt(now()->subDay())) {
            return $cached->result;
        }
        try {
            $res = Http::timeout(20)->acceptJson()->withToken($key)
                ->post(Setting::get('fraud_api_url', 'https://bdcourier.com/api/courier-check'), ['phone' => $phone]);
            $data = $res->json('courierData') ?? [];
            $out = [];
            foreach ($data as $name => $row) {
                if ($name === 'summary' || ! is_array($row)) {
                    continue;
                }
                $out[] = [
                    'name' => $row['name'] ?? ucfirst($name),
                    'total' => (int) ($row['total_parcel'] ?? 0),
                    'delivered' => (int) ($row['success_parcel'] ?? 0),
                    'cancelled' => (int) ($row['cancelled_parcel'] ?? 0),
                ];
            }
            FraudCheck::updateOrCreate(['phone' => $phone], ['result' => $out]);

            return $out;
        } catch (Throwable) {
            return $cached?->result ?? [];
        }
    }
}
