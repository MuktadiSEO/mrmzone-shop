<?php

namespace App\Models;

use App\Models\Concerns\HasSlug;
use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    use HasSlug;

    protected $guarded = ['id'];

    protected $casts = ['is_active' => 'boolean'];
}
