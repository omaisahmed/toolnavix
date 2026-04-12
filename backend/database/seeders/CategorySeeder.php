<?php

// =============================================
// 1. CategorySeeder.php
// Run this FIRST: php artisan db:seed --class=CategorySeeder
// =============================================

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $categories = [
            ['name' => 'New AI Tools',          'slug' => 'new-ai-tools',            'description' => 'Latest and freshly launched AI tools.', 'icon' => '🆕'],
            ['name' => 'AI Tools',              'slug' => 'all',                     'description' => 'Complete directory of all AI tools.', 'icon' => '🤖'],
            ['name' => 'Free AI Tools',         'slug' => 'free-ai-tools',           'description' => 'Completely free AI tools and resources.', 'icon' => '🆓'],
            ['name' => 'Featured AI Tools',     'slug' => 'featured-ai-tools',       'description' => 'Handpicked premium and top-rated AI tools.', 'icon' => '⭐'],
            ['name' => 'Text & Content',        'slug' => 'text-content',            'description' => 'AI tools for writing, copywriting, and content generation.', 'icon' => '📝'],
            ['name' => 'Images & Photos',       'slug' => 'images-photos',           'description' => 'AI image generation, editing, and photo tools.', 'icon' => '🖼️'],
            ['name' => 'Video & 3D',            'slug' => 'video-3d',                'description' => 'AI video creation, editing, and 3D generation tools.', 'icon' => '🎥'],
            ['name' => 'Chat & Chatbots',       'slug' => 'chat-chatbots',           'description' => 'AI chatbots, conversational agents, and assistants.', 'icon' => '💬'],
            ['name' => 'Marketing',             'slug' => 'marketing',               'description' => 'AI tools for marketing, ads, and campaigns.', 'icon' => '📈'],
            ['name' => 'Social Media',          'slug' => 'social-media',            'description' => 'AI tools for social media content and management.', 'icon' => '📱'],
            ['name' => 'Business & Office',     'slug' => 'business-office',         'description' => 'AI tools for business operations and productivity.', 'icon' => '💼'],
            ['name' => 'Coding & Development',  'slug' => 'coding-development',      'description' => 'AI coding assistants and developer tools.', 'icon' => '💻'],
            ['name' => 'Art & Animation',       'slug' => 'art-animation',           'description' => 'AI art generators and animation tools.', 'icon' => '🎨'],
            ['name' => 'Music & Sound',         'slug' => 'music-audio',             'description' => 'AI music generation and audio tools.', 'icon' => '🎵'],
            ['name' => 'Education',             'slug' => 'education',               'description' => 'AI tools for learning, tutoring, and education.', 'icon' => '📚'],
            ['name' => 'SEO',                   'slug' => 'seo',                     'description' => 'AI SEO optimization and keyword tools.', 'icon' => '🔍'],
            ['name' => 'E-commerce',            'slug' => 'e-commerce-shopping',     'description' => 'AI tools for online stores and e-commerce.', 'icon' => '🛒'],
            ['name' => 'Productivity',          'slug' => 'productivity',            'description' => 'AI productivity and workflow tools.', 'icon' => '⏱️'],
            ['name' => 'AI Assistants & Agents','slug' => 'ai-assistants-agents',    'description' => 'Autonomous AI assistants and agents.', 'icon' => '🤖'],
            ['name' => 'Automation & Macros',   'slug' => 'automation-macros',       'description' => 'AI automation and no-code workflow tools.', 'icon' => '⚙️'],
            ['name' => 'Research & Data',       'slug' => 'research-data',           'description' => 'AI research, data analysis, and insights tools.', 'icon' => '📊'],
            ['name' => 'Entertainment & Fun',   'slug' => 'entertainment-fun',       'description' => 'Fun and entertainment AI tools.', 'icon' => '🎉'],
            // Additional categories from the site
            ['name' => 'AI Apps for iPhone',    'slug' => 'ai-apps-for-iphone',      'description' => 'AI tools and apps for iOS/iPhone.', 'icon' => '📱'],
            ['name' => 'AI Apps for Android',   'slug' => 'ai-apps-for-android',     'description' => 'AI tools and apps for Android.', 'icon' => '📱'],
            ['name' => 'AI Tools for X (Twitter)', 'slug' => 'ai-tools-for-twitter', 'description' => 'AI tools optimized for Twitter/X.', 'icon' => '𝕏'],
            ['name' => 'AI Tools for Linkedin', 'slug' => 'ai-tools-for-linkedin',   'description' => 'LinkedIn growth and automation tools.', 'icon' => '🔗'],
            ['name' => 'AI Tools for Instagram','slug' => 'ai-tools-for-instagram',  'description' => 'Instagram content and growth AI tools.', 'icon' => '📸'],
            ['name' => 'AI Tools for Youtube',  'slug' => 'ai-tools-for-youtube',    'description' => 'YouTube content creation and analytics tools.', 'icon' => '▶️'],
            ['name' => 'AI Chrome Extensions',  'slug' => 'ai-chrome-extensions',    'description' => 'AI-powered Chrome browser extensions.', 'icon' => '🔌'],
            ['name' => 'AI Tools for WordPress','slug' => 'ai-tools-for-wordpress',  'description' => 'WordPress AI plugins and tools.', 'icon' => '🔌'],
            ['name' => 'AI Tools for Shopify',  'slug' => 'ai-tools-for-shopify',    'description' => 'Shopify AI apps and tools.', 'icon' => '🛍️'],
            ['name' => 'Podcasts and Vodcasts', 'slug' => 'podcasts-and-vodcasts',   'description' => 'AI tools for podcast and video podcast creation.', 'icon' => '🎙️'],
            ['name' => 'NSFW',                  'slug' => 'nsfw',                    'description' => 'NSFW / adult AI content tools.', 'icon' => '🔞'],
        ];

        foreach ($categories as $data) {
            Category::updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'name' => $data['name'],
                    'description' => $data['description'],
                    'icon' => $data['icon'] ?? null,
                    'meta_title' => $data['name'] . ' | ToolPilot AI',
                    'meta_description' => 'Best ' . strtolower($data['name']) . ' AI tools and resources on ToolPilot.ai',
                    'meta_keywords' => strtolower($data['name']) . ', ai tools, toolpilot',
                    'icon_alt' => $data['name'] . ' icon',
                    'icon_title' => $data['name'],
                ]
            );
        }

        $this->command->info('✅ Categories seeded successfully (' . count($categories) . ' categories from https://www.toolpilot.ai/collections)');
    }
}