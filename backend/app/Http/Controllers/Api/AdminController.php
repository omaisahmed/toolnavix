<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Review;
use App\Models\Setting;
use App\Models\Tool;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    public function stats()
    {
        return response()->json([
            'total_tools' => Tool::count(),
            'total_users' => User::count(),
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

    public function updateUser(User $user, Request $request)
    {
        $this->authorize('admin');

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
        ]);

        $user->update($validated);

        return response()->json(['message' => 'User updated', 'user' => $user]);
    }

    public function storeUser(Request $request)
    {
        $this->authorize('admin');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        $validated['password'] = bcrypt($validated['password']);

        $user = User::create($validated);

        return response()->json(['message' => 'User created', 'user' => $user], 201);
    }

    public function banUser(User $user)
    {
        $this->authorize('admin');

        $user->forceFill(['banned' => true])->save();

        return response()->json(['message' => 'User deleted']);
    }

    public function reviews()
    {
        $this->authorize('admin');

        return response()->json(Review::with(['user', 'tool'])->orderByDesc('created_at')->paginate(30));
    }

    public function approveReview(Review $review)
    {
        $this->authorize('admin');

        $review->update(['approved' => true]);

        return response()->json(['message' => 'Review approved']);
    }

    public function deleteReview(Review $review)
    {
        $this->authorize('admin');

        $review->delete();

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

    public function updateSettings(Request $request)
    {
        $this->authorize('admin');

        $settings = Setting::firstOrNew();

        if ($request->hasFile('logo')) {
            if ($settings->logo_url) {
                $this->deleteStoredFile($settings->logo_url);
            }
            $logoPath = $request->file('logo')->store('uploads/settings', 'public');
            $settings->logo_url = $logoPath;
        }

        if ($request->hasFile('favicon')) {
            if ($settings->favicon_url) {
                $this->deleteStoredFile($settings->favicon_url);
            }
            $faviconPath = $request->file('favicon')->store('uploads/settings', 'public');
            $settings->favicon_url = $faviconPath;
        }

        $settings->save();

        return response()->json(['message' => 'Settings updated', 'settings' => $this->formatSettings($settings)]);
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
}