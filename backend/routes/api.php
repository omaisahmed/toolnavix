<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AiSearchController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookmarkController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\ToolController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/tools', [ToolController::class, 'index']);
Route::get('/tools/featured', [ToolController::class, 'featured']);
Route::get('/tools/top', [ToolController::class, 'top']);
Route::get('/tools/free', [ToolController::class, 'free']);
Route::get('/tools/new', [ToolController::class, 'newest']);
Route::get('/tools/{slug}', [ToolController::class, 'show']);
Route::post('/tools/{slug}/view', [ToolController::class, 'trackView']);

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{slug}/tools', [CategoryController::class, 'tools']);
Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/{slug}', [PostController::class, 'show']);
Route::post('/ai-search', [AiSearchController::class, 'search']);
Route::get('/settings', [AdminController::class, 'getPublicSettings']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::post('/bookmark', [BookmarkController::class, 'store']);
    Route::get('/bookmarks', [BookmarkController::class, 'index']);
    Route::delete('/bookmark/{tool}', [BookmarkController::class, 'destroy']);
    Route::get('/saved-tools', [BookmarkController::class, 'savedTools']);
    Route::post('/saved-tools', [BookmarkController::class, 'saveTool']);
    Route::delete('/saved-tools/{id}', [BookmarkController::class, 'removeSavedTool']);

    Route::post('/tools', [ToolController::class, 'store']);
    Route::put('/tools/{tool}', [ToolController::class, 'update']);
    Route::post('/tools/{tool}', [ToolController::class, 'update']);
    Route::delete('/tools/{tool}', [ToolController::class, 'destroy']);
    Route::delete('/tools', [ToolController::class, 'bulkDestroy']);

    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{category}', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
    Route::delete('/categories', [CategoryController::class, 'bulkDestroy']);
    Route::post('/posts', [PostController::class, 'store']);
    Route::put('/posts/{post}', [PostController::class, 'update']);
    Route::post('/posts/{post}', [PostController::class, 'update']);
    Route::delete('/posts/{post}', [PostController::class, 'destroy']);
    Route::delete('/posts', [PostController::class, 'bulkDestroy']);
    Route::get('/dashboard/posts', [PostController::class, 'index']);

    Route::get('/dashboard/stats', [AdminController::class, 'stats']);
    Route::get('/dashboard/settings', [AdminController::class, 'getSettings']);
    Route::put('/dashboard/settings', [AdminController::class, 'updateSettings']);
    Route::post('/dashboard/settings', [AdminController::class, 'updateSettings']);
    Route::get('/dashboard/users', [AdminController::class, 'users']);
    Route::post('/dashboard/users', [AdminController::class, 'storeUser']);
    Route::put('/dashboard/users/{user}', [AdminController::class, 'updateUser']);
    Route::post('/dashboard/users/{user}/ban', [AdminController::class, 'banUser']);
    Route::delete('/dashboard/users/{user}', [AdminController::class, 'deleteUser']);
    Route::delete('/dashboard/users', [AdminController::class, 'bulkDeleteUsers']);
    Route::get('/dashboard/reviews', [AdminController::class, 'reviews']);
    Route::post('/dashboard/reviews/{review}/approve', [AdminController::class, 'approveReview']);
    Route::delete('/dashboard/reviews/{review}', [AdminController::class, 'deleteReview']);
    Route::delete('/dashboard/reviews', [AdminController::class, 'bulkDeleteReviews']);
});
