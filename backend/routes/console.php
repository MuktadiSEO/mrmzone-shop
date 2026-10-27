<?php

use App\Models\IncompleteOrder;
use App\Models\Order;
use App\Services\Courier\CourierManager;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

/*
| Scheduled jobs — on the VPS add one cron line:
|   * * * * * cd /var/www/mrmzone-shop/backend && php artisan schedule:run >> /dev/null 2>&1
| (the Docker setup runs this automatically in the `scheduler` container)
*/

Artisan::command('orders:sync-courier {--limit=200}', function (CourierManager $couriers) {
    $orders = Order::with('items')->whereNotNull('consignment_id')->whereIn('status', ['shipped', 'on_hold'])
        ->orderBy('updated_at')->limit((int) $this->option('limit'))->get();
    $changed = 0;
    foreach ($orders as $order) {
        try {
            $before = $order->status;
            $after = $couriers->refresh($order)->status;
            $changed += $before !== $after ? 1 : 0;
        } catch (Throwable $e) {
            $this->warn("{$order->number}: {$e->getMessage()}");
        }
    }
    $this->info("Checked {$orders->count()} parcels, {$changed} status changes.");
})->purpose('Pull latest parcel status from Steadfast / Pathao / RedX');

Artisan::command('orders:prune-incomplete {--days=30}', function () {
    $n = IncompleteOrder::where('status', 'open')->where('updated_at', '<', now()->subDays((int) $this->option('days')))->update(['status' => 'expired']);
    $this->info("{$n} incomplete orders expired.");
})->purpose('Expire old abandoned checkouts');

Schedule::command('orders:sync-courier')->hourly()->withoutOverlapping();
Schedule::command('orders:prune-incomplete')->daily();
