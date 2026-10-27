<?php

namespace App\Services\Courier;

use App\Models\Order;
use App\Models\Setting;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/** Pathao Courier merchant API (Aladdin). Sandbox base: https://courier-api-sandbox.pathao.com */
class PathaoCourier implements CourierDriver
{
    private function base(): string
    {
        return rtrim((string) Setting::get('pathao_base_url', 'https://api-hermes.pathao.com'), '/');
    }

    private function token(): string
    {
        return Cache::remember('pathao.token', now()->addHours(12), function () {
            foreach (['pathao_client_id', 'pathao_client_secret', 'pathao_username', 'pathao_password', 'pathao_store_id'] as $k) {
                if (! Setting::get($k)) {
                    throw new CourierException('Pathao সেটিংস অসম্পূর্ণ ('.$k.')।');
                }
            }
            $res = Http::timeout(20)->acceptJson()->post($this->base().'/aladdin/api/v1/issue-token', [
                'client_id' => Setting::get('pathao_client_id'),
                'client_secret' => Setting::get('pathao_client_secret'),
                'username' => Setting::get('pathao_username'),
                'password' => Setting::get('pathao_password'),
                'grant_type' => 'password',
            ]);
            if (! $res->successful() || ! $res->json('access_token')) {
                throw new CourierException('Pathao লগইন ব্যর্থ: '.$res->body());
            }

            return $res->json('access_token');
        });
    }

    private function client(): PendingRequest
    {
        return Http::baseUrl($this->base())->timeout(20)->acceptJson()->withToken($this->token());
    }

    public function book(Order $order, array $options = []): array
    {
        $order->loadMissing('items');
        $payload = array_filter([
            'store_id' => (int) Setting::get('pathao_store_id'),
            'merchant_order_id' => $order->number,
            'recipient_name' => $order->customer_name,
            'recipient_phone' => $order->phone,
            'recipient_address' => trim($order->address.($order->district ? ', '.$order->district : '')),
            'recipient_city' => $options['city_id'] ?? null,
            'recipient_zone' => $options['zone_id'] ?? null,
            'delivery_type' => 48,
            'item_type' => 2,
            'special_instruction' => $options['note'] ?? $order->note,
            'item_quantity' => (int) $order->items->sum('quantity'),
            'item_weight' => (float) ($options['weight'] ?? 0.5),
            'amount_to_collect' => max(0, $order->total - $order->advance_paid),
            'item_description' => $order->items->pluck('name')->implode(', '),
        ], fn ($v) => $v !== null && $v !== '');
        $res = $this->client()->post('/aladdin/api/v1/orders', $payload);
        $data = $res->json('data');
        if (! $res->successful() || ! $data) {
            throw new CourierException('Pathao: '.($res->json('message') ?? $res->body()));
        }

        return [
            'consignment_id' => (string) $data['consignment_id'],
            'tracking_code' => (string) $data['consignment_id'],
            'status' => (string) ($data['order_status'] ?? 'Pending'),
        ];
    }

    public function status(Order $order): string
    {
        $res = $this->client()->get('/aladdin/api/v1/orders/'.$order->consignment_id.'/info');
        if (! $res->successful()) {
            throw new CourierException('Pathao: '.$res->body());
        }

        return (string) $res->json('data.order_status', 'unknown');
    }

    public function balance(): ?int
    {
        return null;
    }
}
