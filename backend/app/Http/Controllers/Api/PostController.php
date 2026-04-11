<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Category;
use App\Services\PostService;
use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Http\Requests\BulkDestroyPostRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PostController extends Controller
{
    public function __construct(protected PostService $postService)
    {
    }

    public function index(Request $request)
    {
        $query = Post::query();

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if (! $request->user()?->isAdmin()) {
            $query->where('published', true);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%'.$search.'%')
                    ->orWhere('excerpt', 'like', '%'.$search.'%')
                    ->orWhere('content', 'like', '%'.$search.'%');
            });
        }

        $posts = $query
            ->orderByDesc('published_at')
            ->orderByDesc('created_at')
            ->paginate((int) ($request->per_page ?? 12));

        $posts->getCollection()->transform(fn (Post $post) => $this->formatPost($post));

        return response()->json($posts);
    }

    public function show(string $slug)
    {
        $post = Post::where('slug', $slug)->firstOrFail();

        if (! $post->published) {
            abort(404);
        }

        return response()->json($this->formatPost($post));
    }

    public function store(StorePostRequest $request)
    {
        $post = $this->postService->create($request->validated(), $request->file('image'));

        return response()->json($this->formatPost($post), 201);
    }

    public function update(UpdatePostRequest $request, Post $post)
    {
        $post = $this->postService->update($post, $request->validated(), $request->file('image'));

        return response()->json($this->formatPost($post));
    }

    public function destroy(Post $post)
    {
        $this->authorize('admin');
        $this->postService->destroy($post);

        return response()->json(['message' => 'Post deleted']);
    }

    protected function buildUniqueSlug(?string $requestedSlug, string $fallbackSource, ?int $ignoreId = null): string
    {
        $base = Str::slug(trim((string) ($requestedSlug ?: $fallbackSource)));
        if (! $base) {
            $base = 'post';
        }

        $slug = $base;
        $counter = 2;

        while (Post::query()
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->where('slug', $slug)
            ->exists()) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }

    protected function formatPost(Post $post): Post
    {
        // Use Cloudinary URL if available, otherwise fallback to local storage
        if ($post->image_url) {
            $post->image = $post->image_url;
        } elseif ($post->image && ! (str_starts_with($post->image, 'http://') || str_starts_with($post->image, 'https://'))) {
            $post->image = url('/storage/'.ltrim($post->image, '/'));
        }

        // If category is numeric, look up the category name
        if ($post->category && is_numeric($post->category)) {
            $category = Category::find($post->category);
            $post->category = $category ? $category->name : 'General';
        }

        return $post;
    }

    protected function deleteStoredImage(?string $path): void
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

    protected function resolvePublishedAt(mixed $publishedAt): string
    {
        return $publishedAt ? (string) $publishedAt : now()->toDateTimeString();
    }

    public function bulkDestroy(BulkDestroyPostRequest $request)
    {
        $count = $this->postService->bulkDestroy($request->input('ids'));

        return response()->json(['message' => $count . ' posts deleted']);
    }
}
