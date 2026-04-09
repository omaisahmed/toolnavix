<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tool;
use App\Models\ToolView;
use App\Services\ToolService;
use App\Http\Requests\StoreToolRequest;
use App\Http\Requests\UpdateToolRequest;
use App\Http\Requests\BulkDestroyToolRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ToolController extends Controller
{
    public function __construct(protected ToolService $toolService)
    {
    }

    public function index(Request $request)
    {
        $query = Tool::with('category');

        if ($request->filled('category')) {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->category);
            });
        }

        if ($request->filled('pricing')) {
            $query->where('pricing', $this->normalizePricing($request->pricing));
        }

        if ($request->filled('rating')) {
            $query->where('rating', '>=', floatval($request->rating));
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->search.'%')->orWhere('description', 'like', '%'.$request->search.'%');
        }

        if ($request->filled('sort')) {
            if ($request->sort === 'trending') {
                $query->orderByDesc('trending')->orderByDesc('updated_at');
            } elseif ($request->sort === 'new') {
                $query->orderByDesc('created_at');
            } elseif ($request->sort === 'top-rated') {
                $query->orderByDesc('rating');
            }
        } else {
            $query->orderByDesc('featured');
        }

        $tools = $query->paginate((int) ($request->per_page ?? 16));
        $tools->getCollection()->transform(function (Tool $tool) {
            return $this->formatTool($tool);
        });

        return response()->json($tools);
    }

    public function show(string $slug)
    {
        $tool = Tool::with(['category', 'reviews'])->where('slug', $slug)->firstOrFail();

        return response()->json($this->formatTool($tool));
    }

    public function featured(Request $request)
    {
        $tools = Tool::with('category')
            ->where('featured', true)
            ->orderByDesc('updated_at')
            ->paginate((int) ($request->per_page ?? 16));

        $tools->getCollection()->transform(fn (Tool $tool) => $this->formatTool($tool));

        return response()->json($tools);
    }

    public function top(Request $request)
    {
        $tools = Tool::with('category')
            ->withCount('views')
            ->orderByDesc('is_top')
            ->orderByDesc('rating')
            ->orderByDesc('views_count')
            ->paginate((int) ($request->per_page ?? 16));

        $tools->getCollection()->transform(fn (Tool $tool) => $this->formatTool($tool));

        return response()->json($tools);
    }

    public function free(Request $request)
    {
        $tools = Tool::with('category')
            ->where('pricing', 'free')
            ->orderByDesc('rating')
            ->paginate((int) ($request->per_page ?? 16));

        $tools->getCollection()->transform(fn (Tool $tool) => $this->formatTool($tool));

        return response()->json($tools);
    }

    public function newest(Request $request)
    {
        $tools = Tool::with('category')
            ->orderByDesc('created_at')
            ->paginate((int) ($request->per_page ?? 16));

        $tools->getCollection()->transform(fn (Tool $tool) => $this->formatTool($tool));

        return response()->json($tools);
    }

    public function trackView(Request $request, string $slug)
    {
        $tool = Tool::where('slug', $slug)->firstOrFail();

        ToolView::create([
            'tool_id' => $tool->id,
            'user_id' => $request->user()?->id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'View tracked']);
    }

    public function store(StoreToolRequest $request)
    {
        $tool = $this->toolService->create($request->validated(), $request->file('logo'));

        return response()->json($this->toolService->formatTool($tool), 201);
    }

    public function update(UpdateToolRequest $request, Tool $tool)
    {
        $tool = $this->toolService->update($tool, $request->validated(), $request->file('logo'));

        return response()->json($this->toolService->formatTool($tool));
    }

    public function destroy(Tool $tool)
    {
        $this->authorize('admin');

        $this->toolService->destroy($tool);

        return response()->json(['message' => 'Tool deleted']);
    }

    protected function formatTool(Tool $tool): Tool
    {
        if ($tool->logo && ! (str_starts_with($tool->logo, 'http://') || str_starts_with($tool->logo, 'https://'))) {
            $tool->logo = url('/storage/'.ltrim($tool->logo, '/'));
        }

        return $tool;
    }

    protected function deleteStoredLogo(?string $path): void
    {
        if (! $path) {
            return;
        }

        $relativePath = preg_replace('#^(?:https?://[^/]+)?/storage/#', '', $path);
        if (! $relativePath) {
            return;
        }

        if (Storage::disk('public')->exists($relativePath)) {
            Storage::disk('public')->delete($relativePath);
        }
    }

    protected function deleteEmbeddedImagesFromValue(mixed $value): void
    {
        if (is_array($value)) {
            foreach ($value as $item) {
                $this->deleteEmbeddedImagesFromValue($item);
            }

            return;
        }

        if (! is_string($value) || trim($value) === '') {
            return;
        }

        $this->deleteEmbeddedImages($value);
    }

    protected function deleteEmbeddedImages(?string $content): void
    {
        if (! $content) {
            return;
        }

        // Extract image URLs from content (assuming they are in /storage/ path)
        preg_match_all('#/storage/([^"\']+)#', $content, $matches);
        
        foreach ($matches[1] as $relativePath) {
            if (Storage::disk('public')->exists($relativePath)) {
                Storage::disk('public')->delete($relativePath);
            }
        }
    }

    protected function normalizePricing(string $pricing): string
    {
        return $pricing === 'free_trial' ? 'Free trial' : $pricing;
    }

    protected function buildUniqueSlug(?string $requestedSlug, string $fallbackSource, ?int $ignoreId = null): string
    {
        $base = Str::slug(trim((string) ($requestedSlug ?: $fallbackSource)));
        if (! $base) {
            $base = 'tool';
        }

        $slug = $base;
        $counter = 2;

        while (Tool::query()
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->where('slug', $slug)
            ->exists()) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }

    public function bulkDestroy(BulkDestroyToolRequest $request)
    {
        $count = $this->toolService->bulkDestroy($request->input('ids'));

        return response()->json(['message' => $count . ' tools deleted']);
    }
}
