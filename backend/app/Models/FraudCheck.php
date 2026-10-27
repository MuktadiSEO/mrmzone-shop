<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FraudCheck extends Model
{
    protected $guarded = ['id'];

    protected $casts = ['result' => 'array'];
}
