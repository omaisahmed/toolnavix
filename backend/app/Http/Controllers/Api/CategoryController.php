<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(Category::orderBy('name')->get());
    }

    public function tools(Request $request, string $slug)
    {
        $category = Category::where('slug', $slug)->firstOrFail();

        $tools = $category->tools()
            ->with('category')
            ->orderByDesc('featured')
            ->orderByDesc('rating')
            ->paginate((int) ($request->per_page ?? 16));

        $tools->getCollection()->transform(function ($tool) {
            if ($tool->logo && ! (str_starts_with($tool->logo, 'http://') || str_starts_with($tool->logo, 'https://'))) {
                $tool->logo = url('/storage/'.ltrim($tool->logo, '/'));
            }
            return $tool;
        });

        return response()->json([
            'category' => $category,
            'tools' => $tools,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('admin');

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:categories,name',
            'slug' => 'nullable|string|max:255|unique:categories,slug',
            'description' => 'nullable|string|max:3000',
            'icon' => 'nullable|string|max:120',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['slug'] = $this->buildUniqueSlug($data['slug'] ?? null, $data['name']);

        $category = Category::create($data);

        return response()->json($category, 201);
    }

    public function update(Request $request, Category $category)
    {
        $this->authorize('admin');

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255|unique:categories,name,'.$category->id,
            'slug' => 'sometimes|nullable|string|max:255|unique:categories,slug,'.$category->id,
            'description' => 'nullable|string|max:3000',
            'icon' => 'nullable|string|max:120',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        if (array_key_exists('slug', $data)) {
            $baseName = $data['name'] ?? $category->name;
            $data['slug'] = $this->buildUniqueSlug($data['slug'], $baseName, $category->id);
        }

        $category->update($data);

        return response()->json($category);
    }

    public function destroy(Category $category)
    {
        $this->authorize('admin');

        $category->delete();

        return response()->json(['message' => 'Category deleted']);
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
