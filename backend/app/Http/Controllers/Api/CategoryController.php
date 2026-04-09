<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\CategoryService;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Requests\BulkDestroyCategoryRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function __construct(protected CategoryService $categoryService)
    {
    }

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

    public function store(StoreCategoryRequest $request)
    {
        $category = $this->categoryService->create($request->validated());

        return response()->json($category, 201);
    }

    public function update(UpdateCategoryRequest $request, Category $category)
    {
        $category = $this->categoryService->update($category, $request->validated());

        return response()->json($category);
    }

    public function destroy(Category $category)
    {
        $this->authorize('admin');

        $this->categoryService->destroy($category);

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

    public function bulkDestroy(BulkDestroyCategoryRequest $request)
    {
        $count = $this->categoryService->bulkDestroy($request->input('ids'));

        return response()->json(['message' => $count . ' categories deleted']);
    }
}
