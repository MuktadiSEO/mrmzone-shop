<?php

namespace App\Services\Courier;

use App\Models\Order;
use App\Models\Setting;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

/** RedX open API. Requires a delivery area id (from RedX area list) per parcel. */
class RedxCourier implements CourierDriver
{
    public const BASE = 'https://openapi.redx.com.bd/v1.0.0-beta';

    private function client(): PendingRequest
    {
        $token = Setting::get('redx_token');
        if (! $token) {
            throw new CourierException('RedX API token সেটিংসে দেওয়া হয়নি।');
        }

        return Http::baseUrl(self::BASE)->timeout(20)->acceptJson()->withHeaders(['API-ACCESS-TOKEN' => 'Bearer '.$token]);
    }

    public function book(Order $order, array $options = []): array
    {
        $order->loadMissing('items');
        $res = $this->client()->post('/parcel', [
            'customer_name' => $order->customer_name,
            'customer_phone' => $order->phone,
            'delivery_area' => $options['area_name'] ?? ($order->district ?: 'Dhaka'),
            'delivery_area_id' => (int) ($options['area_id'] ?? Setting::get('redx_default_area_id', 1)),
            'customer_address' => $order->address,
            'merchant_invoice_id' => $order->number,
            'cash_collection_amount' => (string) max(0, $order->total - $order->advance_paid),
            'parcel_weight' => (int) (($options['weight'] ?? 0.5) * 1000),
            'value' => (string) $order->total,
            'instruction' => $options['note'] ?? $order->note,
        ]);
        $id = $res->json('tracking_id');
        if (! $res->successful() || ! $id) {
            throw new CourierException('RedX: '.($res->json('message') ?? $res->body()));
        }

        return ['consignment_id' => (string) $id, 'tracking_code' => (string) $id, 'status' => 'pickup-pending'];
    }

    public function status(Order $order): string
    {
        $res = $this->client()->get('/parcel/info/'.$order->consignment_id);
        if (! $res->successful()) {
            throw new CourierException('RedX: '.$res->body());
        }

        return (string) $res->json('parcel.status', 'unknown');
    }

    public function balance(): ?int
    {
        return null;
    }
}
