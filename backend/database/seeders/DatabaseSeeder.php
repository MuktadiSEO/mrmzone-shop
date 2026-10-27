<?php

namespace Database\Seeders;

use App\Models\Banner;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\LandingPage;
use App\Models\Page;
use App\Models\Product;
use App\Models\User;
use App\Services\StockService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(AdminSeeder::class);
        $this->call(PageSeeder::class);

        if (! app()->isProduction() || env('SEED_DEMO', false)) {
            $this->demoCatalog();
        }
    }

    private function demoCatalog(): void
    {
        $cats = [
            ['ফ্যাশন', 'fashion', 'shirt'], ['লাইফস্টাইল', 'lifestyle', 'bag'], ['অ্যাক্সেসরিজ', 'accessories', 'watch'],
            ['গ্যাজেট', 'gadgets', 'headphones'], ['হোম ও লিভিং', 'home-living', 'home'], ['সিজনাল', 'seasonal', 'snowflake'],
        ];
        $catIds = [];
        foreach ($cats as $i => [$name, $slug, $icon]) {
            $catIds[$slug] = Category::firstOrCreate(['slug' => $slug], ['name' => $name, 'icon' => $icon, 'sort_order' => $i])->id;
        }

        $stock = app(StockService::class);
        $products = [
            ['ফ্লিস হুডি (ইউনিসেক্স)', 'fleece-hoodie', 'fashion', 950, 890, 360, 'Best Seller', ['color' => ['কালো', 'অ্যাশ'], 'size' => ['M', 'L', 'XL']]],
            ['শীতের নরম শাল', 'winter-shawl', 'seasonal', 850, 790, 290, 'নতুন', ['color' => ['মেরুন', 'অফ-হোয়াইট', 'কালো', 'অলিভ']]],
            ['উইন্টার কম্বো সেট (মাফলার + টুপি + গ্লাভস)', 'winter-combo-set', 'seasonal', 550, 490, 180, null, ['color' => ['ছেলেদের ডিজাইন', 'মেয়েদের ডিজাইন']]],
            ['বাইক উইন্টার গ্লাভস (টাচস্ক্রিন)', 'bike-winter-gloves', 'accessories', 750, 650, 260, 'Hot', ['size' => ['M', 'L', 'XL']]],
            ['ক্যাজুয়াল ব্যাকপ্যাক', 'casual-backpack', 'lifestyle', 1290, 1090, 520, null, []],
            ['স্মার্ট ওয়াচ', 'smart-watch', 'gadgets', 2490, 1990, 1150, 'Deal', []],
            ['ওয়্যারলেস ইয়ারবাডস', 'wireless-earbuds', 'gadgets', 1690, 1390, 720, null, []],
            ['মিনিমাল লেদার ওয়ালেট', 'leather-wallet', 'accessories', 690, null, 250, null, []],
            ['কটন বেডশিট সেট', 'cotton-bedsheet-set', 'home-living', 1450, 1250, 680, null, []],
            ['এলইডি ডেস্ক ল্যাম্প', 'led-desk-lamp', 'home-living', 990, 850, 430, null, []],
            ['প্রিমিয়াম পোলো শার্ট', 'premium-polo', 'fashion', 750, 650, 300, null, ['size' => ['M', 'L', 'XL', 'XXL']]],
            ['ফোন কেস (শকপ্রুফ)', 'shockproof-phone-case', 'gadgets', 350, 290, 90, null, []],
        ];
        foreach ($products as $i => [$name, $slug, $cat, $price, $sale, $cost, $badge, $options]) {
            if (Product::where('slug', $slug)->exists()) {
                continue;
            }
            $p = Product::create([
                'name' => $name, 'slug' => $slug, 'sku' => 'MRM-'.str_pad((string) ($i + 1), 3, '0', STR_PAD_LEFT),
                'category_id' => $catIds[$cat], 'price' => $price, 'sale_price' => $sale, 'cost_price' => $cost,
                'short_description' => 'মানসম্মত পণ্য, সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।',
                'description' => '<p>'.$name.' — আরামদায়ক, টেকসই এবং ব্যবহারে সহজ। পণ্য হাতে পেয়ে দেখে টাকা পরিশোধ করুন।</p><ul><li>প্রিমিয়াম কোয়ালিটি</li><li>৩ দিনের রিটার্ন সুবিধা (ত্রুটিপূর্ণ পণ্যে)</li><li>সারা দেশে হোম ডেলিভারি</li></ul>',
                'images' => [], 'badge' => $badge, 'is_featured' => $i < 6, 'status' => 'active', 'stock' => 0,
            ]);
            if ($options) {
                $keys = array_keys($options);
                $combos = [[]];
                foreach ($options as $k => $vals) {
                    $next = [];
                    foreach ($combos as $c) {
                        foreach ($vals as $v) {
                            $next[] = $c + [$k => $v];
                        }
                    }
                    $combos = $next;
                }
                foreach ($combos as $attrs) {
                    $v = $p->variants()->create(['name' => implode(' / ', $attrs), 'attributes' => $attrs, 'stock' => 0, 'sku' => $p->sku.'-'.Str::upper(Str::random(3))]);
                    $stock->adjust($p->id, $v->id, 5, 'opening', null, 'Demo stock');
                }
                $p->update(['options' => $options]);
            } else {
                $stock->adjust($p->id, null, 20, 'opening', null, 'Demo stock');
            }
        }

        Banner::firstOrCreate(['title' => 'প্রয়োজনের সবকিছু, এক জায়গায়'], [
            'subtitle' => 'মানসম্মত পণ্য · সাশ্রয়ী দাম · সারা বাংলাদেশে ক্যাশ অন ডেলিভারি',
            'image' => '', 'link' => '/products', 'button_text' => 'এখনই কিনুন', 'position' => 'hero',
        ]);
        Coupon::firstOrCreate(['code' => 'MRMZONE10'], ['type' => 'percent', 'value' => 10, 'min_order' => 500, 'max_discount' => 200]);
        LandingPage::firstOrCreate(['slug' => 'winter-shawl-offer'], [
            'title' => 'শীতের শাল অফার', 'product_id' => Product::where('slug', 'winter-shawl')->value('id'),
            'headline' => 'এই শীতে উষ্ণ থাকুন, স্টাইলিশ থাকুন', 'subheadline' => 'নরম ও ভারী কাপড়ের শাল — ৪টি রঙে',
            'offer_text' => '২টি নিলে ডেলিভারি চার্জ ফ্রি!', 'theme_color' => '#0B1F3A',
            'sections' => [
                ['type' => 'features', 'title' => 'কেন আমাদের শাল?', 'items' => ['নরম ও আরামদায়ক কাপড়', 'ধোয়ার পর রঙ ওঠে না', 'উপহার দেওয়ার মতো প্যাকেজিং', 'পণ্য দেখে টাকা দিন']],
                ['type' => 'faq', 'title' => 'সাধারণ প্রশ্ন', 'items' => [
                    ['q' => 'ডেলিভারি কতদিনে পাব?', 'a' => 'ঢাকার ভেতরে ১-৩ দিন, ঢাকার বাইরে ২-৫ দিন।'],
                    ['q' => 'অগ্রিম টাকা দিতে হবে?', 'a' => 'না, পণ্য হাতে পেয়ে টাকা দিন।'],
                ]],
            ],
        ]);
    }
}
