<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    /** Returns the discount for a subtotal, or an error message when the coupon can't be used. */
    public function evaluate(int $subtotal): array
    {
        $now = now();
        if (! $this->is_active) {
            return ['error' => 'এই কুপনটি এখন সক্রিয় নয়।'];
        }
        if ($this->starts_at && $now->lt($this->starts_at)) {
            return ['error' => 'এই কুপনটি এখনো শুরু হয়নি।'];
        }
        if ($this->ends_at && $now->gt($this->ends_at)) {
            return ['error' => 'এই কুপনের মেয়াদ শেষ।'];
        }
        if ($this->usage_limit !== null && $this->used >= $this->usage_limit) {
            return ['error' => 'এই কুপনের ব্যবহার সীমা শেষ।'];
        }
        if ($subtotal < $this->min_order) {
            return ['error' => "কমপক্ষে ৳{$this->min_order} অর্ডারে এই কুপন প্রযোজ্য।"];
        }
        $discount = $this->type === 'percent'
            ? (int) floor($subtotal * $this->value / 100)
            : (int) $this->value;
        if ($this->max_discount) {
            $discount = min($discount, (int) $this->max_discount);
        }

        return ['discount' => min($discount, $subtotal)];
    }
}
