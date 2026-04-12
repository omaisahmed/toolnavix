<?php

namespace App\Services;

use App\Models\Review;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use App\Services\CloudinaryService;

class AdminService
{
    public function __construct(
        protected CloudinaryService $cloudinaryService
    ) {}

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

    public function updateSettings(array $data, ?UploadedFile $logoFile = null, ?UploadedFile $faviconFile = null, ?UploadedFile $socialImageFile = null): Setting
    {
        $settings = Setting::firstOrNew();
        $logoData = null;
        $faviconData = null;
        $socialImageData = null;

        if (! empty($data['remove_logo'])) {
            if ($settings->logo_public_id) {
                $this->cloudinaryService->deleteImage($settings->logo_public_id);
            }
            $data['logo_url'] = null;
            $data['logo_public_id'] = null;
        }

        if (! empty($data['remove_favicon'])) {
            if ($settings->favicon_public_id) {
                $this->cloudinaryService->deleteImage($settings->favicon_public_id);
            }
            $data['favicon_url'] = null;
            $data['favicon_public_id'] = null;
        }

        if (! empty($data['remove_social_image'])) {
            if ($settings->social_image_public_id) {
                $this->cloudinaryService->deleteImage($settings->social_image_public_id);
            }
            $data['social_image_url'] = null;
            $data['social_image_public_id'] = null;
        }

        if ($logoFile) {
            $logoData = $this->cloudinaryService->uploadImage($logoFile, 'settings/logos');
            if ($logoData) {
                $data['logo_url'] = $logoData['secure_url'];
                $data['logo_public_id'] = $logoData['public_id'];
            }
        }

        if ($faviconFile) {
            $faviconData = $this->cloudinaryService->uploadImage($faviconFile, 'settings/favicons');
            if ($faviconData) {
                $data['favicon_url'] = $faviconData['secure_url'];
                $data['favicon_public_id'] = $faviconData['public_id'];
            }
        }

        if ($socialImageFile) {
            $socialImageData = $this->cloudinaryService->uploadImage($socialImageFile, 'settings/social');
            if ($socialImageData) {
                $data['social_image_url'] = $socialImageData['secure_url'];
                $data['social_image_public_id'] = $socialImageData['public_id'];
            }
        }

        return DB::transaction(function () use ($settings, $data, $logoData, $faviconData, $socialImageData) {
            // Delete old images from Cloudinary if new ones are uploaded
            if ($logoData && $settings->logo_public_id) {
                $this->cloudinaryService->deleteImage($settings->logo_public_id);
            }

            if ($faviconData && $settings->favicon_public_id) {
                $this->cloudinaryService->deleteImage($settings->favicon_public_id);
            }

            if ($socialImageData && $settings->social_image_public_id) {
                $this->cloudinaryService->deleteImage($settings->social_image_public_id);
            }

            foreach ($data as $key => $value) {
                if (in_array($key, ['logo_url', 'logo_public_id', 'logo_alt', 'logo_title', 'favicon_url', 'favicon_public_id', 'favicon_alt', 'favicon_title', 'social_image_url', 'social_image_public_id', 'site_title', 'default_meta_description', 'footer_text', 'hero_badge', 'hero_title', 'hero_subtitle', 'hero_search_placeholder', 'hero_search_button_text', 'hero_tag_1', 'hero_tag_2', 'hero_tag_3'], true)) {
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
