<?php

namespace App\Http\Controllers;

use App\Models\Tool;
use App\Models\Post;
use App\Models\Category;
use Illuminate\Http\Request;

class SitemapController extends Controller
{
    public function index()
    {
        $tools = Tool::where('featured', true)->get();
        $posts = Post::where('published', true)->get();
        $categories = Category::all();

        return response()->view('sitemap', [
            'tools' => $tools,
            'posts' => $posts,
            'categories' => $categories,
        ])->header('Content-Type', 'application/xml');
    }

    public function robots()
    {
        $content = "User-agent: *\nAllow: /\n\nSitemap: " . url('/sitemap.xml');

        return response($content)->header('Content-Type', 'text/plain');
    }
}
