<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SitemapController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', function () {
    return redirect(config('app.frontend_url', 'http://localhost:3000') . '/login');
})->name('login');

// Route::get('/register', function () {
//     return redirect(config('app.frontend_url', 'http://localhost:3000') . '/register');
// })->name('register');

Route::get('/sitemap.xml', [SitemapController::class, 'index']);
Route::get('/robots.txt', [SitemapController::class, 'robots']);
