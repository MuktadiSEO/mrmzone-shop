<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Setting;
use App\Models\SmsLog;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Sends SMS through a Bangladeshi gateway. Supported providers:
 *  - bulksmsbd  (bulksmsbd.net)  — api_key + sender id
 *  - log        — no real sending; only writes to sms_logs (useful while testing)
 * Add more providers in send().
 */
class SmsService
{
    public function send(string $phone, string $message, string $type = 'manual'): SmsLog
    {
        $log = SmsLog::create(['phone' => $phone, 'message' => $message, 'type' => $type, 'status' => 'queued']);
        $provider = Setting::get('sms_provider', 'log');
        $apiKey = Setting::get('sms_api_key');

        if ($provider === 'log' || ! $apiKey) {
            $log->update(['status' => 'logged', 'response' => 'SMS gateway not configured']);

            return $log;
        }

        try {
            $response = match ($provider) {
                'bulksmsbd' => Http::timeout(15)->asForm()->post('http://bulksmsbd.net/api/smsapi', [
                    'api_key' => $apiKey,
                    'type' => 'text',
                    'number' => '88'.$phone,
                    'senderid' => Setting::get('sms_sender_id'),
                    'message' => $message,
                ]),
                default => null,
            };
            if (! $response) {
                $log->update(['status' => 'failed', 'response' => "Unknown provider {$provider}"]);
            } else {
                $log->update(['status' => $response->successful() ? 'sent' : 'failed', 'response' => mb_substr($response->body(), 0, 1000)]);
            }
        } catch (Throwable $e) {
            $log->update(['status' => 'failed', 'response' => $e->getMessage()]);
        }

        return $log;
    }

    public function orderEvent(Order $order, string $event): void
    {
        if (Setting::get("sms_on_order_{$event}") !== '1') {
            return;
        }
        $template = (string) Setting::get("sms_template_{$event}", '');
        if ($template === '') {
            return;
        }
        $message = strtr($template, [
            '{name}' => $order->customer_name,
            '{number}' => $order->number,
            '{total}' => (string) $order->total,
            '{tracking}' => (string) ($order->tracking_code ?: $order->consignment_id ?: ''),
        ]);
        $this->send($order->phone, $message, "order_{$event}");
    }
}
