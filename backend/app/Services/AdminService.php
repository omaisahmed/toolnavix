<?php

namespace App\Services;

use App\Models\Review;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AdminService
{
    public function createUser(array $data): User
    {
        $data['password'] = bcrypt($data['password']);

        return DB::transaction(function () use ($data) {
            return User::create($data);
        });
    }

    public function updateUser(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $user->update($data);
            return $user;
        });
    }

    public function banUser(User $user): void
    {
        DB::transaction(function () use ($user) {
            $user->forceFill(['banned' => true])->save();
        });
    }

    public function deleteUser(User $user): void
    {
        if ($user->is_admin && User::where('is_admin', true)->count() === 1) {
            throw new \RuntimeException('Cannot delete the last admin user');
        }

        DB::transaction(function () use ($user) {
            $user->delete();
        });
    }

    public function approveReview(Review $review): void
    {
        DB::transaction(function () use ($review) {
            $review->update(['approved' => true]);
        });
    }

    public function deleteReview(Review $review): void
    {
        DB::transaction(function () use ($review) {
            $review->delete();
        });
    }

    public function updateSettings(array $data, ?UploadedFile $logoFile = null, ?UploadedFile $faviconFile = null): Setting
    {
        $settings = Setting::firstOrNew();
        $newLogoPath = null;
        $newFaviconPath = null;

        if ($logoFile) {
            $newLogoPath = $logoFile->store('uploads/settings', 'public');
            $data['logo_url'] = $newLogoPath;
        }

        if ($faviconFile) {
            $newFaviconPath = $faviconFile->store('uploads/settings', 'public');
            $data['favicon_url'] = $newFaviconPath;
        }

        return DB::transaction(function () use ($settings, $data, $newLogoPath, $newFaviconPath) {
            if (array_key_exists('logo_url', $data) && $settings->logo_url && $settings->logo_url !== $data['logo_url']) {
                $this->deleteStoredFile($settings->logo_url);
            }

            if (array_key_exists('favicon_url', $data) && $settings->favicon_url && $settings->favicon_url !== $data['favicon_url']) {
                $this->deleteStoredFile($settings->favicon_url);
            }

            foreach ($data as $key => $value) {
                if ($key === 'logo_url' || $key === 'favicon_url') {
                    $settings->{$key} = $value;
                    continue;
                }

                if (in_array($key, ['footer_text', 'hero_badge', 'hero_title', 'hero_subtitle', 'hero_search_placeholder', 'hero_search_button_text', 'hero_tag_1', 'hero_tag_2', 'hero_tag_3'], true)) {
                    $settings->{$key} = $value ?: null;
                }
            }

            $settings->save();

            return $settings;
        });
    }

    public function formatSettings(Setting $settings = null)
    {
        if (! $settings) {
            return [];
        }

        if ($settings->logo_url && ! (str_starts_with($settings->logo_url, 'http://') || str_starts_with($settings->logo_url, 'https://'))) {
            $settings->logo_url = url('/storage/' . ltrim($settings->logo_url, '/'));
        }

        if ($settings->favicon_url && ! (str_starts_with($settings->favicon_url, 'http://') || str_starts_with($settings->favicon_url, 'https://'))) {
            $settings->favicon_url = url('/storage/' . ltrim($settings->favicon_url, '/'));
        }

        return $settings;
    }

    protected function deleteStoredFile(?string $path): void
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
}
