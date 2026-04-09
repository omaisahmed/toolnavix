<?php

namespace App\Services;

use App\Models\Post;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PostService
{
    public function create(array $data, ?UploadedFile $imageFile = null): Post
    {
        $data = $this->prepareTags($data);
        $data['slug'] = $this->buildUniqueSlug($data['slug'] ?? null, $data['title']);
        $data['published_at'] = $this->resolvePublishedAt($data['published_at'] ?? null);

        if ($imageFile) {
            $data['image'] = $imageFile->store('uploads/posts', 'public');
        }

        unset($data['remove_image']);

        try {
            return DB::transaction(function () use ($data) {
                return Post::create($data);
            });
        } catch (\Throwable $exception) {
            if (isset($data['image'])) {
                Storage::disk('public')->delete($data['image']);
            }

            throw $exception;
        }
    }

    public function update(Post $post, array $data, ?UploadedFile $imageFile = null): Post
    {
        $data = $this->prepareTags($data);

        if (array_key_exists('slug', $data)) {
            $data['slug'] = $this->buildUniqueSlug($data['slug'], $data['title'] ?? $post->title, $post->id);
        }

        if (array_key_exists('published_at', $data)) {
            $data['published_at'] = $this->resolvePublishedAt($data['published_at']);
        }

        if (! empty($data['remove_image'])) {
            $this->deleteStoredImage($post->getRawOriginal('image'));
            $data['image'] = null;
        }

        $newImagePath = null;
        if ($imageFile) {
            $newImagePath = $imageFile->store('uploads/posts', 'public');
            $data['image'] = $newImagePath;
            $this->deleteStoredImage($post->getRawOriginal('image'));
        }

        unset($data['remove_image']);

        try {
            return DB::transaction(function () use ($post, $data) {
                $post->update($data);
                return $post;
            });
        } catch (\Throwable $exception) {
            if ($newImagePath) {
                Storage::disk('public')->delete($newImagePath);
            }

            throw $exception;
        }
    }

    public function destroy(Post $post): void
    {
        $imagePath = $post->getRawOriginal('image');
        $content = $post->content;

        DB::transaction(function () use ($post) {
            $post->delete();
        });

        $this->deleteStoredImage($imagePath);
        $this->deleteEmbeddedImages($content);
    }

    public function bulkDestroy(array $ids): int
    {
        $posts = Post::whereIn('id', $ids)->get();

        DB::transaction(function () use ($posts) {
            foreach ($posts as $post) {
                $post->delete();
            }
        });

        foreach ($posts as $post) {
            $this->deleteStoredImage($post->getRawOriginal('image'));
            $this->deleteEmbeddedImages($post->content);
        }

        return $posts->count();
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

    protected function resolvePublishedAt(mixed $publishedAt): string
    {
        return $publishedAt ? (string) $publishedAt : now()->toDateTimeString();
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

        preg_match_all('#/storage/([^"\']+)#', $content, $matches);

        foreach ($matches[1] as $relativePath) {
            if (Storage::disk('public')->exists($relativePath)) {
                Storage::disk('public')->delete($relativePath);
            }
        }
    }

    protected function prepareTags(array $data): array
    {
        if (isset($data['tags']) && is_string($data['tags'])) {
            $decoded = json_decode($data['tags'], true);
            $data['tags'] = is_array($decoded) ? $decoded : [];
        }

        return $data;
    }
}
