<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreToolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin();
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'slug' => 'nullable|string|max:255|unique:tools,slug',
            'category_id' => 'required|exists:categories,id',
            'pricing' => 'required|in:free,paid,freemium,free_trial,Free trial',
            'rating' => 'nullable|numeric|min:0|max:5',
            'visit_url' => 'nullable|string',
            'logo' => 'sometimes|image|max:10240',
            'remove_logo' => 'sometimes|boolean',
            'logo_alt' => 'nullable|string|max:255',
            'logo_title' => 'nullable|string|max:255',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:1000',
            'meta_keywords' => 'nullable|string|max:500',
            'featured' => 'boolean',
            'trending' => 'boolean',
            'just_landed' => 'boolean',
            'is_top' => 'boolean',
            'features' => 'json',
            'pros' => 'json',
            'cons' => 'json',
        ];
    }
}