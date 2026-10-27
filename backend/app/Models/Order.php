<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'courier_booked_at' => 'datetime',
        'delivered_at' => 'datetime',
        'stock_deducted' => 'boolean',
    ];

    public const STATUSES = [
        'pending' => 'নতুন',
        'confirmed' => 'কনফার্মড',
        'processing' => 'প্রসেসিং',
        'shipped' => 'কুরিয়ারে',
        'delivered' => 'ডেলিভারড',
        'partial' => 'আংশিক ডেলিভারি',
        'on_hold' => 'হোল্ড',
        'cancelled' => 'বাতিল',
        'returned' => 'ফেরত',
    ];

    /** Statuses after which the order no longer holds stock. */
    public const RELEASES_STOCK = ['cancelled', 'returned'];

    public const SOURCES = ['web', 'app', 'landing', 'facebook', 'manual', 'pos', 'whatsapp'];

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function history(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class)->latest('id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    public static function generateNumber(): string
    {
        $prefix = 'MRM-'.now()->format('ymd').'-';
        $last = static::where('number', 'like', $prefix.'%')->orderByDesc('id')->value('number');
        $seq = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix.str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }
}
