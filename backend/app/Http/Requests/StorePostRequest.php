<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin();
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:posts,slug',
            'type' => 'required|in:blog,news,guide',
            'category' => 'required|string|max:120',
            'tags' => 'nullable|json',
            'excerpt' => 'nullable|string|max:1200',
            'image' => 'sometimes|image|max:10240',
            'remove_image' => 'sometimes|boolean',
            'content' => 'nullable|string',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'published' => 'sometimes|boolean',
            'published_at' => 'nullable|date',
        ];
    }
}