<?php

namespace App\Services\Courier;

use App\Models\Order;
use App\Services\OrderService;
use App\Services\SmsService;

class CourierManager
{
    public const DRIVERS = [
        'steadfast' => SteadfastCourier::class,
        'pathao' => PathaoCourier::class,
        'redx' => RedxCourier::class,
    ];

    public function __construct(private OrderService $orders, private SmsService $sms) {}

    public function driver(string $name): CourierDriver
    {
        $class = self::DRIVERS[$name] ?? throw new CourierException("Unknown courier: {$name}");

        return app($class);
    }

    public function book(Order $order, string $courier, array $options = []): Order
    {
        if ($order->consignment_id) {
            throw new CourierException("এই অর্ডারটি আগেই {$order->courier} এ পাঠানো হয়েছে।");
        }
        if (in_array($order->status, ['cancelled', 'returned', 'delivered'], true)) {
            throw new CourierException('এই স্ট্যাটাসের অর্ডার কুরিয়ারে পাঠানো যাবে না।');
        }
        $result = $this->driver($courier)->book($order, $options);
        $order->forceFill([
            'courier' => $courier,
            'consignment_id' => $result['consignment_id'],
            'tracking_code' => $result['tracking_code'],
            'courier_status' => $result['status'],
            'courier_booked_at' => now(),
        ])->save();
        $this->orders->changeStatus($order, 'shipped', ucfirst($courier).' এ পাঠানো হয়েছে (CID: '.$result['consignment_id'].')');
        $this->sms->orderEvent($order->refresh(), 'shipped');

        return $order->refresh()->load('items', 'history');
    }

    public function refresh(Order $order): Order
    {
        if (! $order->courier || ! $order->consignment_id) {
            throw new CourierException('এই অর্ডারটি এখনো কুরিয়ারে পাঠানো হয়নি।');
        }
        $status = $this->driver($order->courier)->status($order);
        $order->forceFill(['courier_status' => $status])->save();
        $mapped = self::mapStatus($status);
        if ($mapped && $mapped !== $order->status) {
            $this->orders->changeStatus($order, $mapped, 'কুরিয়ার স্ট্যাটাস: '.$status);
        }

        return $order->refresh()->load('items', 'history');
    }

    /** Map courier-specific statuses to our order statuses (null = no change). */
    public static function mapStatus(string $courierStatus): ?string
    {
        $s = strtolower(str_replace([' ', '-'], '_', $courierStatus));

        return match (true) {
            in_array($s, ['delivered', 'delivered_approval_pending'], true) => 'delivered',
            in_array($s, ['partial_delivered', 'partial_delivered_approval_pending', 'partial_delivery'], true) => 'partial',
            in_array($s, ['cancelled', 'cancelled_approval_pending', 'return', 'returned', 'returned_to_merchant', 'return_received'], true) => 'returned',
            default => null,
        };
    }
}
