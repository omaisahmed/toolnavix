<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Review;
use App\Models\Setting;
use App\Models\Tool;
use App\Models\ToolView;
use App\Models\User;
use App\Services\AdminService;
use App\Services\CloudinaryService;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Requests\UpdateSettingsRequest;
use App\Http\Requests\BulkDeleteUsersRequest;
use App\Http\Requests\BulkDeleteReviewsRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    public function __construct(protected AdminService $adminService, protected CloudinaryService $cloudinaryService)
    {
    }

    public function stats()
    {
        return response()->json([
            'total_tools' => Tool::count(),
            'total_users' => User::count(),
            'total_views' => ToolView::count(),
            'trending_tools' => Tool::where('trending', true)->take(10)->get(),
            'featured_tools' => Tool::where('featured', true)->take(10)->get(),
            'new_tools' => Tool::orderByDesc('created_at')->take(10)->get(),
        ]);
    }

    public function users()
    {
        $this->authorize('admin');

        return response()->json(User::orderByDesc('created_at')->paginate(25));
    }

    public function updateUser(UpdateUserRequest $request, User $user)
    {
        $user->update($request->validated());

        return response()->json(['message' => 'User updated', 'user' => $user]);
    }

    public function storeUser(StoreUserRequest $request)
    {
        $user = $this->adminService->createUser($request->validated());

        return response()->json(['message' => 'User created', 'user' => $user], 201);
    }

    public function banUser(User $user)
    {
        $this->authorize('admin');

        $this->adminService->banUser($user);

        return response()->json(['message' => 'User banned']);
    }

    public function deleteUser(User $user)
    {
        $this->authorize('admin');

        try {
            $this->adminService->deleteUser($user);
        } catch (\RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 400);
        }

        return response()->json(['message' => 'User deleted successfully']);
    }

    public function reviews()
    {
        $this->authorize('admin');

        return response()->json(Review::with(['user', 'tool'])->orderByDesc('created_at')->paginate(30));
    }

    public function approveReview(Review $review)
    {
        $this->authorize('admin');

        $this->adminService->approveReview($review);

        return response()->json(['message' => 'Review approved']);
    }

    public function deleteReview(Review $review)
    {
        $this->authorize('admin');

        $this->adminService->deleteReview($review);

        return response()->json(['message' => 'Review deleted']);
    }

    public function categories()
    {
        $this->authorize('admin');

        return response()->json(Category::orderBy('name')->get());
    }

    protected function formatSettings(Setting $settings = null)
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

    public function getPublicSettings()
    {
        $settings = Setting::first();
        return response()->json($this->formatSettings($settings));
    }

    public function getSettings()
    {
        $this->authorize('admin');

        $settings = Setting::first();
        return response()->json($this->formatSettings($settings));
    }

    public function updateSettings(UpdateSettingsRequest $request)
    {
        $settings = $this->adminService->updateSettings(
            $request->validated(),
            $request->file('logo'),
            $request->file('favicon'),
            $request->file('social_image')
        );

        return response()->json(['message' => 'Settings updated', 'settings' => $this->adminService->formatSettings($settings)]);
    }

    protected function deleteStoredFile(?string $path)
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

    public function bulkDeleteUsers(BulkDeleteUsersRequest $request)
    {
        $ids = $request->input('ids');
        $users = User::whereIn('id', $ids)->get();

        foreach ($users as $user) {
            $user->delete();
        }

        return response()->json(['message' => count($users) . ' users deleted']);
    }

    public function bulkDeleteReviews(BulkDeleteReviewsRequest $request)
    {
        $ids = $request->input('ids');
        $reviews = Review::whereIn('id', $ids)->get();

        foreach ($reviews as $review) {
            $review->delete();
        }

        return response()->json(['message' => count($reviews) . ' reviews deleted']);
    }

    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image',
            'folder' => 'required|string|in:editor,logos,favicons,posts,tools',
        ]);

        $file = $request->file('image');
        $folder = $request->input('folder');

        // Map folder names to Cloudinary folders
        $folderMap = [
            'editor' => 'posts/editor',
            'logos' => 'settings/logos',
            'favicons' => 'settings/favicons',
            'posts' => 'posts/images',
            'tools' => 'tools/logos',
        ];

        $cloudinaryFolder = $folderMap[$folder] ?? 'misc';

        $result = $this->cloudinaryService->uploadImage($file, $cloudinaryFolder);

        if (!$result) {
            return response()->json(['error' => 'Failed to upload image'], 500);
        }

        return response()->json([
            'url' => $result['secure_url'],
            'public_id' => $result['public_id'],
        ]);
    }
}
