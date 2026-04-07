<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

class PostController extends Controller
{
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

    public function store(Request $request)
    {
        $this->authorize('admin');

        $validator = Validator::make($request->all(), [
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
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['slug'] = $this->buildUniqueSlug($data['slug'] ?? null, $data['title']);
        $data['published_at'] = $this->resolvePublishedAt($data['published_at'] ?? null);
        if (isset($data['tags']) && is_string($data['tags'])) {
            $data['tags'] = json_decode($data['tags'], true);
        }
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('uploads/posts', 'public');
        }
        unset($data['remove_image']);

        $post = Post::create($data);

        return response()->json($this->formatPost($post), 201);
    }

    public function update(Request $request, Post $post)
    {
        $this->authorize('admin');

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'slug' => 'sometimes|nullable|string|max:255|unique:posts,slug,'.$post->id,
            'type' => 'sometimes|in:blog,news,guide',
            'category' => 'nullable|string|max:120',
            'tags' => 'nullable|json',
            'excerpt' => 'nullable|string|max:1200',
            'image' => 'sometimes|image|max:10240',
            'remove_image' => 'sometimes|boolean',
            'content' => 'sometimes|string',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'published' => 'sometimes|boolean',
            'published_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        if (array_key_exists('slug', $data)) {
            $baseTitle = $data['title'] ?? $post->title;
            $data['slug'] = $this->buildUniqueSlug($data['slug'], $baseTitle, $post->id);
        }
        if (array_key_exists('published_at', $data)) {
            $data['published_at'] = $this->resolvePublishedAt($data['published_at']);
        }
        if (isset($data['tags']) && is_string($data['tags'])) {
            $data['tags'] = json_decode($data['tags'], true);
        }
        if (! empty($data['remove_image'])) {
            $this->deleteStoredImage($post->getRawOriginal('image'));
            $data['image'] = null;
        }
        if ($request->hasFile('image')) {
            $this->deleteStoredImage($post->getRawOriginal('image'));
            $data['image'] = $request->file('image')->store('uploads/posts', 'public');
        }
        unset($data['remove_image']);

        $post->update($data);

        return response()->json($this->formatPost($post));
    }

    public function destroy(Post $post)
    {
        $this->authorize('admin');
        $this->deleteStoredImage($post->getRawOriginal('image'));
        $post->delete();

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
        if ($post->image && ! (str_starts_with($post->image, 'http://') || str_starts_with($post->image, 'https://'))) {
            $post->image = url('/storage/'.ltrim($post->image, '/'));
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

    protected function resolvePublishedAt(mixed $publishedAt): string
    {
        return $publishedAt ? (string) $publishedAt : now()->toDateTimeString();
    }
}
