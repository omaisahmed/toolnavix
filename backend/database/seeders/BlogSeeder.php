<?php

// =============================================
// 3. BlogSeeder.php  (for regular blog posts)
// Run after categories: php artisan db:seed --class=BlogSeeder
// =============================================

namespace Database\Seeders;

use App\Models\Post;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BlogSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $posts = [
            [
                'title' => 'Fashion AI: Maximizing ROI Beyond the Camera',
                'slug' => 'fashion-ai-maximizing-roi-beyond-the-camera',
                'excerpt' => 'This article explains how AI fashion photography is helping brands reduce production costs, move faster, and create realistic, scalable product imagery.',
                'content' => 'Full article content can be added later or fetched from the original URL.',
            ],
            [
                'title' => 'Are AI Agents Now Renting Humans?',
                'slug' => 'are-ai-agents-now-renting-humans',
                'excerpt' => 'AI agents are no longer limited to digital work. They can now hire real people for physical tasks.',
            ],
            [
                'title' => 'Meet Atoms: Push Digital Product Building into Overdrive with an AI Team',
                'slug' => 'meet-atoms-push-digital-product-building-into-overdrive-with-an-ai-team',
                'excerpt' => 'Atoms helps founders and makers turn ideas into digital products faster.',
            ],
            [
                'title' => 'The Rise of AI Agents: Top AI Trends to Check for 2026',
                'slug' => 'the-rise-of-ai-agents-top-ai-trends-to-check-for-2026',
                'excerpt' => 'AI agents are redefining automation in 2026.',
            ],
            [
                'title' => 'The Best Exclusive Coupons for AI Tools in 2026 for ToolPilot Users',
                'slug' => 'the-best-exclusive-coupons-for-ai-tools-in-2026-for-toolpilot-users',
                'excerpt' => 'Explore the best exclusive AI tool coupons offering major discounts.',
            ],
        ];

        foreach ($posts as $postData) {
            Post::updateOrCreate(
                ['slug' => $postData['slug']],
                [
                    'title' => $postData['title'],
                    'slug' => $postData['slug'],
                    'type' => 'blog',
                    'category' => 'General',
                    'tags' => ['ai', 'tools', 'trends'],
                    'excerpt' => $postData['excerpt'] ?? '',
                    'content' => $postData['content'] ?? $postData['excerpt'] ?? '',
                    'image' => null,
                    'meta_title' => $postData['title'],
                    'meta_description' => $postData['excerpt'] ?? '',
                    'published' => true,
                    'published_at' => now()->subDays(rand(1, 30)),
                ]
            );
        }

        $this->command->info('✅ Blog posts seeded successfully (from https://www.toolpilot.ai/blogs/news)');
    }
}