<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin();
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                Rule::unique('posts', 'slug')->ignore($this->route('post')->id),
            ],
            'type' => 'sometimes|in:blog,news,guide',
            'category' => 'nullable|string|max:120',
            'tags' => 'nullable|json',
            'excerpt' => 'nullable|string|max:1200',
            'image' => 'sometimes|image|max:10240',
            'remove_image' => 'sometimes|boolean',
            'image_alt' => 'sometimes|nullable|string|max:255',
            'image_title' => 'sometimes|nullable|string|max:255',
            'content' => 'sometimes|nullable|string',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'published' => 'sometimes|boolean',
            'published_at' => 'nullable|date',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('content') && ! is_null($this->input('content')) && ! is_string($this->input('content'))) {
            $this->merge(['content' => null]);
        }
    }
}
