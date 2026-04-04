<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AiSearchController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookmarkController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ToolController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/tools', [ToolController::class, 'index']);
Route::get('/tools/{slug}', [ToolController::class, 'show']);

Route::get('/categories', [CategoryController::class, 'index']);
Route::post('/ai-search', [AiSearchController::class, 'search']);
Route::get('/settings', [AdminController::class, 'getPublicSettings']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::post('/bookmark', [BookmarkController::class, 'store']);
    Route::get('/bookmarks', [BookmarkController::class, 'index']);
    Route::delete('/bookmark/{tool}', [BookmarkController::class, 'destroy']);

    Route::post('/tools', [ToolController::class, 'store']);
    Route::put('/tools/{tool}', [ToolController::class, 'update']);
    Route::delete('/tools/{tool}', [ToolController::class, 'destroy']);

    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{category}', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

    Route::get('/dashboard/stats', [AdminController::class, 'stats']);
    Route::get('/dashboard/settings', [AdminController::class, 'getSettings']);
    Route::put('/dashboard/settings', [AdminController::class, 'updateSettings']);
    Route::post('/dashboard/settings', [AdminController::class, 'updateSettings']);
    Route::get('/dashboard/users', [AdminController::class, 'users']);
    Route::post('/dashboard/users', [AdminController::class, 'storeUser']);
    Route::put('/dashboard/users/{user}', [AdminController::class, 'updateUser']);
    Route::post('/dashboard/users/{user}/ban', [AdminController::class, 'banUser']);
    Route::get('/dashboard/reviews', [AdminController::class, 'reviews']);
    Route::post('/dashboard/reviews/{review}/approve', [AdminController::class, 'approveReview']);
    Route::delete('/dashboard/reviews/{review}', [AdminController::class, 'deleteReview']);
});