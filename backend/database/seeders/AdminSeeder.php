<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AdminSeeder extends Seeder
{
    /**
     * Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD in .env.
     * If no password is set, a random one is generated and printed once.
     */
    public function run(): void
    {
        $email = env('ADMIN_EMAIL', 'admin@mrmzone.shop');
        if (User::where('email', $email)->exists()) {
            return;
        }
        $password = env('ADMIN_PASSWORD') ?: Str::password(14, symbols: false);
        User::create([
            'name' => env('ADMIN_NAME', 'MRM Zone Admin'),
            'email' => $email,
            'phone' => env('ADMIN_PHONE') ?: null,
            'password' => $password,
            'role' => 'admin',
        ]);
        if (! env('ADMIN_PASSWORD')) {
            $this->command?->warn("Admin created: {$email} / {$password}  ← save this password now");
        }
    }
}
