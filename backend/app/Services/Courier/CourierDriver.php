<?php

namespace App\Services\Courier;

use App\Models\Order;

interface CourierDriver
{
    /** Book a parcel. Returns ['consignment_id' => ..., 'tracking_code' => ..., 'status' => ...]. */
    public function book(Order $order, array $options = []): array;

    /** Current courier status string for an already-booked order. */
    public function status(Order $order): string;

    /** Merchant balance in taka, or null when the courier doesn't expose it. */
    public function balance(): ?int;
}
