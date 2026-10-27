<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Category */
class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'icon' => $this->icon,
            'image' => $this->image,
            'description' => $this->description,
            'parent_id' => $this->parent_id,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'is_featured' => $this->is_featured,
            'products_count' => $this->whenCounted('products'),
            'children' => CategoryResource::collection($this->whenLoaded('children')),
        ];
    }
}
