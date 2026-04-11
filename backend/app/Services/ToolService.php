<?php

namespace App\Services;

use App\Models\Tool;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ToolService
{
    public function __construct(
        protected CloudinaryService $cloudinaryService
    ) {}

    public function create(array $data, ?UploadedFile $logoFile = null): Tool
    {
        $logoData = null;

        if (isset($data['pricing'])) {
            $data['pricing'] = $this->normalizePricing($data['pricing']);
        }

        $data = $this->prepareJsonFields($data);
        $data['slug'] = $this->buildUniqueSlug($data['slug'] ?? null, $data['name']);

        if ($logoFile) {
            $logoData = $this->cloudinaryService->uploadImage($logoFile, 'tools/logos');
            if (! $logoData) {
                throw new \RuntimeException('Unable to upload tool logo to Cloudinary.');
            }

            $data['logo_url'] = $logoData['secure_url'];
            $data['logo_public_id'] = $logoData['public_id'];
        }

        // Remove logo field to prevent storing temp path
        unset($data['logo'], $data['remove_logo']);

        try {
            return DB::transaction(function () use ($data) {
                return Tool::create($data);
            });
        } catch (\Throwable $exception) {
            if ($logoData && isset($logoData['public_id'])) {
                $this->cloudinaryService->deleteImage($logoData['public_id']);
            }

            throw $exception;
        }
    }

    public function update(Tool $tool, array $data, ?UploadedFile $logoFile = null): Tool
    {
        $newLogoData = null;
        $oldLogoPublicId = $tool->logo_public_id;

        if (array_key_exists('pricing', $data)) {
            $data['pricing'] = $this->normalizePricing($data['pricing']);
        }

        if (array_key_exists('slug', $data)) {
            $data['slug'] = $this->buildUniqueSlug($data['slug'], $data['name'] ?? $tool->name, $tool->id);
        }

        $data = $this->prepareJsonFields($data);

        if (! empty($data['remove_logo'])) {
            if ($oldLogoPublicId) {
                $this->cloudinaryService->deleteImage($oldLogoPublicId);
            }
            $data['logo_url'] = null;
            $data['logo_public_id'] = null;
        }

        if ($logoFile) {
            $newLogoData = $this->cloudinaryService->uploadImage($logoFile, 'tools/logos');
            if (! $newLogoData) {
                throw new \RuntimeException('Unable to upload tool logo to Cloudinary.');
            }

            $data['logo_url'] = $newLogoData['secure_url'];
            $data['logo_public_id'] = $newLogoData['public_id'];
            if ($oldLogoPublicId) {
                $this->cloudinaryService->deleteImage($oldLogoPublicId);
            }
        }

        // Remove logo field to prevent storing temp path
        unset($data['logo'], $data['remove_logo']);

        try {
            return DB::transaction(function () use ($tool, $data) {
                $tool->update($data);

                return $tool;
            });
        } catch (\Throwable $exception) {
            if ($newLogoData && isset($newLogoData['public_id'])) {
                $this->cloudinaryService->deleteImage($newLogoData['public_id']);
            }

            throw $exception;
        }
    }

    public function destroy(Tool $tool): void
    {
        $logoPublicId = $tool->logo_public_id;

        DB::transaction(function () use ($tool) {
            $tool->delete();
        });

        if ($logoPublicId) {
            $this->cloudinaryService->deleteImage($logoPublicId);
        }
    }

    public function bulkDestroy(array $ids): int
    {
        $tools = Tool::whereIn('id', $ids)->get();

        DB::transaction(function () use ($tools) {
            foreach ($tools as $tool) {
                $tool->delete();
            }
        });

        foreach ($tools as $tool) {
            if ($tool->logo_public_id) {
                $this->cloudinaryService->deleteImage($tool->logo_public_id);
            }
        }

        return $tools->count();
    }

    public function formatTool(Tool $tool): Tool
    {
        // Use Cloudinary URL if available, otherwise fallback to local storage
        if ($tool->logo_url) {
            $tool->logo = $tool->logo_url;
        } elseif ($tool->logo && ! (str_starts_with($tool->logo, 'http://') || str_starts_with($tool->logo, 'https://'))) {
            $tool->logo = url('/storage/'.ltrim($tool->logo, '/'));
        }

        return $tool;
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

    protected function prepareJsonFields(array $data): array
    {
        foreach (['features', 'pros', 'cons'] as $field) {
            if (isset($data[$field]) && is_string($data[$field])) {
                $decoded = json_decode($data[$field], true);
                $data[$field] = is_array($decoded) ? $decoded : [];
            }
        }

        return $data;
    }
}
