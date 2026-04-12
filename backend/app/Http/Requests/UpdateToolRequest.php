<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateToolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin();
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                Rule::unique('tools', 'slug')->ignore($this->route('tool')->id),
            ],
            'category_id' => 'sometimes|exists:categories,id',
            'pricing' => 'sometimes|in:free,paid,freemium,free_trial,Free trial',
            'rating' => 'sometimes|numeric|min:0|max:5',
            'visit_url' => 'sometimes|string',
            'logo' => 'sometimes|image|max:10240',
            'remove_logo' => 'sometimes|boolean',
            'logo_alt' => 'sometimes|nullable|string|max:255',
            'logo_title' => 'sometimes|nullable|string|max:255',
            'meta_title' => 'sometimes|nullable|string|max:255',
            'meta_description' => 'sometimes|nullable|string|max:1000',
            'meta_keywords' => 'sometimes|nullable|string|max:500',
            'featured' => 'sometimes|boolean',
            'trending' => 'sometimes|boolean',
            'just_landed' => 'sometimes|boolean',
            'is_top' => 'sometimes|boolean',
            'features' => 'sometimes|json',
            'pros' => 'sometimes|json',
            'cons' => 'sometimes|json',
        ];
    }
}