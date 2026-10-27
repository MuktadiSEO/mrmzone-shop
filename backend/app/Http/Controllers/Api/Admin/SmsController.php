<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SmsLog;
use App\Services\OrderService;
use App\Services\SmsService;
use Illuminate\Http\Request;

class SmsController extends Controller
{
    public function send(Request $request, SmsService $sms)
    {
        $v = $request->validate(['phones' => 'required|array|min:1|max:1000', 'phones.*' => 'string|max:20', 'message' => 'required|string|max:1000']);
        $sent = 0;
        foreach (array_unique(array_map([OrderService::class, 'normalizePhone'], $v['phones'])) as $phone) {
            if (preg_match('/^01[3-9]\d{8}$/', $phone)) {
                $sms->send($phone, $v['message'], 'bulk');
                $sent++;
            }
        }

        return response()->json(['message' => "$sent টি নম্বরে SMS পাঠানো হয়েছে।", 'sent' => $sent]);
    }

    public function logs(Request $request)
    {
        $page = SmsLog::when($request->query('phone'), fn ($q, $p) => $q->where('phone', 'like', "%$p%"))->latest('id')->paginate(30);

        return response()->json([
            'data' => $page->items(),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total()],
        ]);
    }
}
