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
    public function create(array $data, ?UploadedFile $logoFile = null): Tool
    {
        $storedLogoPath = null;

        if (isset($data['pricing'])) {
            $data['pricing'] = $this->normalizePricing($data['pricing']);
        }

        $data = $this->prepareJsonFields($data);
        $data['slug'] = $this->buildUniqueSlug($data['slug'] ?? null, $data['name']);

        if ($logoFile) {
            $storedLogoPath = $logoFile->store('uploads/tools', 'public');
            $data['logo'] = $storedLogoPath;
        }

        unset($data['remove_logo']);

        try {
            return DB::transaction(function () use ($data) {
                return Tool::create($data);
            });
        } catch (\Throwable $exception) {
            if ($storedLogoPath) {
                Storage::disk('public')->delete($storedLogoPath);
            }

            throw $exception;
        }
    }

    public function update(Tool $tool, array $data, ?UploadedFile $logoFile = null): Tool
    {
        $newLogoPath = null;
        $oldLogoPath = $tool->getRawOriginal('logo');

        if (array_key_exists('pricing', $data)) {
            $data['pricing'] = $this->normalizePricing($data['pricing']);
        }

        if (array_key_exists('slug', $data)) {
            $data['slug'] = $this->buildUniqueSlug($data['slug'], $data['name'] ?? $tool->name, $tool->id);
        }

        $data = $this->prepareJsonFields($data);

        if (! empty($data['remove_logo'])) {
            $this->deleteStoredLogo($oldLogoPath);
            $data['logo'] = null;
        }

        if ($logoFile) {
            $newLogoPath = $logoFile->store('uploads/tools', 'public');
            $data['logo'] = $newLogoPath;
            $this->deleteStoredLogo($oldLogoPath);
        }

        unset($data['remove_logo']);

        try {
            return DB::transaction(function () use ($tool, $data) {
                $tool->update($data);

                return $tool;
            });
        } catch (\Throwable $exception) {
            if ($newLogoPath) {
                Storage::disk('public')->delete($newLogoPath);
            }

            throw $exception;
        }
    }

    public function destroy(Tool $tool): void
    {
        $logoPath = $tool->getRawOriginal('logo');
        $description = $tool->description;
        $features = $tool->features;
        $pros = $tool->pros;
        $cons = $tool->cons;

        DB::transaction(function () use ($tool) {
            $tool->delete();
        });

        $this->deleteStoredLogo($logoPath);
        $this->deleteEmbeddedImagesFromValue($description);
        $this->deleteEmbeddedImagesFromValue($features);
        $this->deleteEmbeddedImagesFromValue($pros);
        $this->deleteEmbeddedImagesFromValue($cons);
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
            $this->deleteStoredLogo($tool->getRawOriginal('logo'));
            $this->deleteEmbeddedImagesFromValue($tool->description);
            $this->deleteEmbeddedImagesFromValue($tool->features);
            $this->deleteEmbeddedImagesFromValue($tool->pros);
            $this->deleteEmbeddedImagesFromValue($tool->cons);
        }

        return $tools->count();
    }

    public function formatTool(Tool $tool): Tool
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
