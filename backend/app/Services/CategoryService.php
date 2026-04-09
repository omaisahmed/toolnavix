<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CategoryService
{
    public function create(array $data): Category
    {
        $data['slug'] = $this->buildUniqueSlug($data['slug'] ?? null, $data['name']);

        return DB::transaction(function () use ($data) {
            return Category::create($data);
        });
    }

    public function update(Category $category, array $data): Category
    {
        if (array_key_exists('slug', $data)) {
            $data['slug'] = $this->buildUniqueSlug($data['slug'], $data['name'] ?? $category->name, $category->id);
        }

        return DB::transaction(function () use ($category, $data) {
            $category->update($data);
            return $category;
        });
    }

    public function destroy(Category $category): void
    {
        DB::transaction(function () use ($category) {
            $category->delete();
        });
    }

    public function bulkDestroy(array $ids): int
    {
        $categories = Category::whereIn('id', $ids)->get();

        DB::transaction(function () use ($categories) {
            foreach ($categories as $category) {
                $category->delete();
            }
        });

        return $categories->count();
    }

    protected function buildUniqueSlug(?string $requestedSlug, string $fallbackSource, ?int $ignoreId = null): string
    {
        $base = Str::slug(trim((string) ($requestedSlug ?: $fallbackSource)));
        if (! $base) {
            $base = 'category';
        }

        $slug = $base;
        $counter = 2;

        while (Category::query()
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->where('slug', $slug)
            ->exists()) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }
}
