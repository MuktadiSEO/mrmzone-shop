<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockMovement;

class StockService
{
    public function adjust(int $productId, ?int $variantId, int $qty, string $type, ?string $reference = null, ?string $note = null): void
    {
        if ($qty === 0) {
            return;
        }
        if ($variantId) {
            ProductVariant::whereKey($variantId)->increment('stock', $qty);
            // keep the parent product's stock in sync with the sum of its variants
            $sum = (int) ProductVariant::where('product_id', $productId)->sum('stock');
            Product::withTrashed()->whereKey($productId)->update(['stock' => $sum]);
        } else {
            Product::withTrashed()->whereKey($productId)->increment('stock', $qty);
        }
        StockMovement::create([
            'product_id' => $productId,
            'variant_id' => $variantId,
            'quantity' => $qty,
            'type' => $type,
            'reference' => $reference,
            'note' => $note,
            'user_id' => auth()->id(),
        ]);
    }

    public function deductForOrder(Order $order): void
    {
        if ($order->stock_deducted) {
            return;
        }
        foreach ($order->items()->get() as $item) {
            if ($item->product_id) {
                $this->adjust($item->product_id, $item->variant_id, -$item->quantity, 'sale', $order->number);
            }
        }
        $order->forceFill(['stock_deducted' => true])->save();
    }

    public function restoreForOrder(Order $order): void
    {
        if (! $order->stock_deducted) {
            return;
        }
        foreach ($order->items()->get() as $item) {
            if ($item->product_id) {
                $this->adjust($item->product_id, $item->variant_id, $item->quantity, 'return', $order->number);
            }
        }
        $order->forceFill(['stock_deducted' => false])->save();
    }
}
