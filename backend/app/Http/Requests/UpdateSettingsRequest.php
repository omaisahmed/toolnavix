<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin();
    }

    public function rules(): array
    {
        return [
            'logo' => 'sometimes|image|max:4096',
            'favicon' => 'sometimes|image|max:2048',
            'remove_logo' => 'sometimes|boolean',
            'remove_favicon' => 'sometimes|boolean',
            'logo_alt' => 'sometimes|nullable|string|max:255',
            'logo_title' => 'sometimes|nullable|string|max:255',
            'favicon_alt' => 'sometimes|nullable|string|max:255',
            'favicon_title' => 'sometimes|nullable|string|max:255',
            'social_image' => 'sometimes|image|max:2048',
            'remove_social_image' => 'sometimes|boolean',
            'site_title' => 'sometimes|nullable|string|max:255',
            'default_meta_description' => 'sometimes|nullable|string|max:1000',
            'footer_text' => 'nullable|string|max:1000',
            'hero_badge' => 'nullable|string|max:120',
            'hero_title' => 'nullable|string|max:255',
            'hero_subtitle' => 'nullable|string|max:1000',
            'hero_search_placeholder' => 'nullable|string|max:255',
            'hero_search_button_text' => 'nullable|string|max:80',
            'hero_tag_1' => 'nullable|string|max:80',
            'hero_tag_2' => 'nullable|string|max:80',
            'hero_tag_3' => 'nullable|string|max:80',
        ];
    }
}