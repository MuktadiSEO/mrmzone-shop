<?php

namespace App\Services\Courier;

use App\Models\Order;
use App\Models\Setting;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

/** Steadfast Courier (packzy) merchant API. Docs: https://portal.packzy.com/api/v1 */
class SteadfastCourier implements CourierDriver
{
    public const BASE = 'https://portal.packzy.com/api/v1';

    private function client(): PendingRequest
    {
        $key = Setting::get('steadfast_api_key');
        $secret = Setting::get('steadfast_secret_key');
        if (! $key || ! $secret) {
            throw new CourierException('Steadfast API key/secret সেটিংসে দেওয়া হয়নি।');
        }

        return Http::baseUrl(self::BASE)->timeout(20)->acceptJson()->withHeaders([
            'Api-Key' => $key,
            'Secret-Key' => $secret,
        ]);
    }

    public function book(Order $order, array $options = []): array
    {
        $res = $this->client()->post('/create_order', [
            'invoice' => $order->number,
            'recipient_name' => $order->customer_name,
            'recipient_phone' => $order->phone,
            'recipient_address' => trim($order->address.($order->district ? ', '.$order->district : '')),
            'cod_amount' => max(0, $order->total - $order->advance_paid),
            'note' => $options['note'] ?? $order->note,
        ]);
        $c = $res->json('consignment');
        if (! $res->successful() || ! $c) {
            throw new CourierException('Steadfast: '.($res->json('message') ?? $res->body()));
        }

        return [
            'consignment_id' => (string) $c['consignment_id'],
            'tracking_code' => (string) ($c['tracking_code'] ?? ''),
            'status' => (string) ($c['status'] ?? 'in_review'),
        ];
    }

    public function status(Order $order): string
    {
        $res = $this->client()->get('/status_by_cid/'.$order->consignment_id);
        if (! $res->successful()) {
            throw new CourierException('Steadfast: '.$res->body());
        }

        return (string) $res->json('delivery_status', 'unknown');
    }

    public function balance(): ?int
    {
        $res = $this->client()->get('/get_balance');

        return $res->successful() ? (int) $res->json('current_balance') : null;
    }
}
