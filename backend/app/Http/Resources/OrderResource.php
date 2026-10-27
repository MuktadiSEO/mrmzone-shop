<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Order */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $staff = (bool) $request->user()?->isStaff();

        return [
            'id' => $this->id,
            'number' => $this->number,
            'status' => $this->status,
            'status_label' => $this->status_label,
            'payment_method' => $this->payment_method,
            'payment_status' => $this->payment_status,
            'customer_name' => $this->customer_name,
            'phone' => $this->phone,
            'address' => $this->address,
            'district' => $this->district,
            'delivery_area' => $this->delivery_area,
            'note' => $this->note,
            'subtotal' => $this->subtotal,
            'delivery_charge' => $this->delivery_charge,
            'discount' => $this->discount,
            'advance_paid' => $this->advance_paid,
            'total' => $this->total,
            'due' => max(0, $this->total - $this->advance_paid),
            'coupon_code' => $this->coupon_code,
            'source' => $this->source,
            'courier' => $this->courier,
            'consignment_id' => $this->consignment_id,
            'tracking_code' => $this->tracking_code,
            'courier_status' => $this->courier_status,
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($i) => [
                'id' => $i->id,
                'product_id' => $i->product_id,
                'variant_id' => $i->variant_id,
                'name' => $i->name,
                'variant' => $i->variant,
                'image' => $i->image,
                'price' => $i->price,
                'quantity' => $i->quantity,
                'total' => $i->total,
            ] + ($staff ? ['cost_price' => $i->cost_price] : []))),
            'history' => $this->whenLoaded('history', fn () => $this->history->map(fn ($h) => [
                'status' => $h->status,
                'note' => $h->note,
                'by' => $staff ? $h->user?->name : null,
                'created_at' => $h->created_at,
            ])),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ] + ($staff ? [
            'admin_note' => $this->admin_note,
            'cost_total' => $this->cost_total,
            'profit' => $this->total - $this->delivery_charge - $this->cost_total,
            'ip' => $this->ip,
            'utm_source' => $this->utm_source,
            'utm_campaign' => $this->utm_campaign,
            'assigned_to' => $this->assigned_to,
            'courier_booked_at' => $this->courier_booked_at,
            'delivered_at' => $this->delivered_at,
        ] : []);
    }
}
