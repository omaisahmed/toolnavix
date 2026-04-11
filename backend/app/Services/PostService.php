<?php

namespace App\Services;

use App\Models\Post;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PostService
{
    public function __construct(
        protected CloudinaryService $cloudinaryService
    ) {}

    public function create(array $data, ?UploadedFile $imageFile = null): Post
    {
        $data = $this->prepareTags($data);
        $data['slug'] = $this->buildUniqueSlug($data['slug'] ?? null, $data['title']);
        $data['published_at'] = $this->resolvePublishedAt($data['published_at'] ?? null);

        if ($imageFile) {
            $folder = $this->getUploadFolder($data['type'] ?? 'blog');
            $imageData = $this->cloudinaryService->uploadImage($imageFile, $folder);
            if ($imageData) {
                $data['image_url'] = $imageData['secure_url'];
                $data['image_public_id'] = $imageData['public_id'];
            }
        }

        unset($data['remove_image']);

        try {
            return DB::transaction(function () use ($data) {
                return Post::create($data);
            });
        } catch (\Throwable $exception) {
            if (isset($imageData) && isset($imageData['public_id'])) {
                $this->cloudinaryService->deleteImage($imageData['public_id']);
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

        $newImageData = null;
        $oldImagePublicId = $post->image_public_id;

        if (! empty($data['remove_image'])) {
            if ($oldImagePublicId) {
                $this->cloudinaryService->deleteImage($oldImagePublicId);
            }
            $data['image_url'] = null;
            $data['image_public_id'] = null;
        }

        if ($imageFile) {
            $folder = $this->getUploadFolder($data['type'] ?? $post->type);
            $newImageData = $this->cloudinaryService->uploadImage($imageFile, $folder);
            if ($newImageData) {
                $data['image_url'] = $newImageData['secure_url'];
                $data['image_public_id'] = $newImageData['public_id'];
                if ($oldImagePublicId) {
                    $this->cloudinaryService->deleteImage($oldImagePublicId);
                }
            }
        }

        unset($data['remove_image']);

        try {
            return DB::transaction(function () use ($post, $data) {
                $post->update($data);
                return $post;
            });
        } catch (\Throwable $exception) {
            if ($newImageData && isset($newImageData['public_id'])) {
                $this->cloudinaryService->deleteImage($newImageData['public_id']);
            }

            throw $exception;
        }
    }

    public function destroy(Post $post): void
    {
        $imagePublicId = $post->image_public_id;

        DB::transaction(function () use ($post) {
            $post->delete();
        });

        if ($imagePublicId) {
            $this->cloudinaryService->deleteImage($imagePublicId);
        }
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
            if ($post->image_public_id) {
                $this->cloudinaryService->deleteImage($post->image_public_id);
            }
        }

        return $posts->count();
    }

    protected function getUploadFolder(string $postType): string
    {
        return match ($postType) {
            'news' => 'posts/ai-news',
            'guide' => 'posts/guides',
            default => 'posts/blogs',
        };
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
