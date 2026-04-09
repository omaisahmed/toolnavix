<?php

namespace App\Rules;

class ValidationRules
{
    public static function toolRules($toolId = null): array
    {
        return [
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:tools,slug' . ($toolId ? ",$toolId" : ''),
            'description' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'pricing' => 'required|in:free,paid,freemium,free_trial,Free trial',
            'rating' => 'sometimes|numeric|min:0|max:5',
            'visit_url' => 'nullable|url',
            'featured' => 'sometimes|boolean',
            'trending' => 'sometimes|boolean',
            'just_landed' => 'sometimes|boolean',
            'is_top' => 'sometimes|boolean',
            'logo' => 'sometimes|image|max:10240',
            'remove_logo' => 'sometimes|boolean',
            'features' => 'nullable|json',
            'pros' => 'nullable|json',
            'cons' => 'nullable|json',
        ];
    }

    public static function categoryRules($categoryId = null): array
    {
        return [
            'name' => 'required|string|max:255|unique:categories,name' . ($categoryId ? ",$categoryId" : ''),
            'slug' => 'nullable|string|max:255|unique:categories,slug' . ($categoryId ? ",$categoryId" : ''),
            'description' => 'nullable|string|max:1000',
            'icon' => 'nullable|string|max:50',
        ];
    }

    public static function postRules($postId = null): array
    {
        return [
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:posts,slug' . ($postId ? ",$postId" : ''),
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

    public static function userRules($userId = null): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email' . ($userId ? ",$userId" : ''),
            'password' => $userId ? 'nullable|string|min:8' : 'required|string|min:8',
            'is_admin' => 'sometimes|boolean',
        ];
    }
}
