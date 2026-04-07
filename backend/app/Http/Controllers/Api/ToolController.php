<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tool;
use App\Models\ToolView;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ToolController extends Controller
{
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

    public function store(Request $request)
    {
        $this->authorize('admin');

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'slug' => 'nullable|string|max:255|unique:tools,slug',
            'category_id' => 'required|exists:categories,id',
            'pricing' => 'required|in:free,paid,freemium,free_trial,Free trial',
            'rating' => 'nullable|numeric|min:0|max:5',
            'visit_url' => 'nullable|url',
            'logo' => 'sometimes|image|max:10240',
            'remove_logo' => 'sometimes|boolean',
            'featured' => 'boolean',
            'trending' => 'boolean',
            'just_landed' => 'boolean',
            'is_top' => 'boolean',
            'features' => 'json',
            'pros' => 'json',
            'cons' => 'json',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['slug'] = $this->buildUniqueSlug($data['slug'] ?? null, $data['name']);
        $data['pricing'] = $this->normalizePricing($data['pricing']);

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('uploads/tools', 'public');
        }

        unset($data['remove_logo']);

        $tool = Tool::create($data);

        return response()->json($this->formatTool($tool), 201);
    }

    public function update(Request $request, Tool $tool)
    {
        $this->authorize('admin');

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'slug' => 'sometimes|nullable|string|max:255|unique:tools,slug,'.$tool->id,
            'category_id' => 'sometimes|exists:categories,id',
            'pricing' => 'sometimes|in:free,paid,freemium,free_trial,Free trial',
            'rating' => 'sometimes|numeric|min:0|max:5',
            'visit_url' => 'sometimes|url',
            'logo' => 'sometimes|image|max:10240',
            'remove_logo' => 'sometimes|boolean',
            'featured' => 'sometimes|boolean',
            'trending' => 'sometimes|boolean',
            'just_landed' => 'sometimes|boolean',
            'is_top' => 'sometimes|boolean',
            'features' => 'sometimes|json',
            'pros' => 'sometimes|json',
            'cons' => 'sometimes|json',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        if (array_key_exists('slug', $data)) {
            $baseName = $data['name'] ?? $tool->name;
            $data['slug'] = $this->buildUniqueSlug($data['slug'], $baseName, $tool->id);
        }
        if (isset($data['pricing'])) {
            $data['pricing'] = $this->normalizePricing($data['pricing']);
        }

        if (! empty($data['remove_logo'])) {
            $this->deleteStoredLogo($tool->getRawOriginal('logo'));
            $data['logo'] = null;
        }

        if ($request->hasFile('logo')) {
            $this->deleteStoredLogo($tool->getRawOriginal('logo'));
            $data['logo'] = $request->file('logo')->store('uploads/tools', 'public');
        }

        unset($data['remove_logo']);

        $tool->update($data);

        return response()->json($this->formatTool($tool));
    }

    public function destroy(Tool $tool)
    {
        $this->authorize('admin');

        $this->deleteStoredLogo($tool->getRawOriginal('logo'));
        $tool->delete();

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
}
