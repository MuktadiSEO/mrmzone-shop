<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\LandingPage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class LandingPageController extends CrudController
{
    protected string $model = LandingPage::class;

    protected array $search = ['title', 'slug'];

    protected array $with = ['product:id,name,slug'];

    protected function rules(Request $request, ?Model $item = null): array
    {
        return [
            'title' => 'required|string|max:150',
            'slug' => 'nullable|string|max:150|unique:landing_pages,slug'.($item ? ','.$item->id : ''),
            'product_id' => 'nullable|integer|exists:products,id',
            'headline' => 'nullable|string|max:200',
            'subheadline' => 'nullable|string|max:300',
            'hero_image' => 'nullable|string|max:500',
            'video_url' => 'nullable|string|max:500',
            'offer_text' => 'nullable|string|max:200',
            'theme_color' => 'nullable|string|max:20',
            'sections' => 'nullable|array',
            'sections.*.type' => 'required|in:features,text,faq,gallery,reviews',
            'sections.*.title' => 'nullable|string|max:200',
            'sections.*.items' => 'nullable|array',
            'is_active' => 'boolean',
        ];
    }
}
