<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', function () {
    return redirect(config('app.frontend_url', 'http://localhost:3000') . '/login');
})->name('login');

// Route::get('/register', function () {
//     return redirect(config('app.frontend_url', 'http://localhost:3000') . '/register');
// })->name('register');
