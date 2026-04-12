<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Tool;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ToolSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $tools = [
            // === Featured Tools ===
            [
                'name' => 'Sunoh.ai', 'slug' => 'sunoh-ai',
                'description' => 'Transcribing Health, Transforming Care – AI medical transcription and clinical documentation.',
                'category_slug' => 'business-office', 'pricing' => 'paid', 'rating' => 5.0,
                'featured' => true, 'trending' => false, 'just_landed' => false,
                'visit_url' => 'https://www.toolpilot.ai/products/sunoh-ai',
            ],
            [
                'name' => 'Akool', 'slug' => 'akool',
                'description' => 'Personalized Generative AGI Content Platform for Commerce.',
                'category_slug' => 'e-commerce-shopping', 'pricing' => 'paid', 'rating' => 5.0,
                'featured' => true, 'trending' => false, 'just_landed' => false,
                'visit_url' => 'https://www.toolpilot.ai/products/akool',
            ],
            [
                'name' => 'ITKDocuments', 'slug' => 'itkdocuments',
                'description' => 'Contract Management for Obligations, SLA\'s, Risk Analysis & Legal Understanding.',
                'category_slug' => 'business-office', 'pricing' => 'paid', 'rating' => 5.0,
                'featured' => true, 'trending' => false, 'just_landed' => false,
                'visit_url' => 'https://www.toolpilot.ai/products/itkdocuments',
            ],
            [
                'name' => 'monday.com', 'slug' => 'monday-com',
                'description' => 'AI-Powered CRM and Work Management Platform.',
                'category_slug' => 'business-office', 'pricing' => 'paid', 'rating' => 5.0,
                'featured' => true, 'trending' => true, 'just_landed' => false,
                'visit_url' => 'https://www.toolpilot.ai/products/monday-com',
            ],

            // === Trending Tools ===
            [
                'name' => 'Opus Clip', 'slug' => 'opus-clip',
                'description' => 'AI-powered Video Repurposing – Turn long videos into viral clips.',
                'category_slug' => 'video-3d', 'pricing' => 'paid', 'rating' => 5.0,
                'featured' => false, 'trending' => true, 'just_landed' => false,
                'visit_url' => 'https://www.toolpilot.ai/products/opus-clip',
            ],
            [
                'name' => 'Repurpose.io', 'slug' => 'repurpose-io',
                'description' => 'AI-Powered Repurposing and distribution platform for video and audio creators.',
                'category_slug' => 'video-3d', 'pricing' => 'paid', 'rating' => 5.0,
                'featured' => false, 'trending' => true, 'just_landed' => false,
                'visit_url' => 'https://www.toolpilot.ai/products/repurpose',
            ],
            [
                'name' => 'HeyGen', 'slug' => 'heygen-ai-video-generator',
                'description' => 'AI Spokesperson Video Generator.',
                'category_slug' => 'video-3d', 'pricing' => 'paid', 'rating' => 5.0,
                'featured' => false, 'trending' => true, 'just_landed' => false,
                'visit_url' => 'https://www.toolpilot.ai/products/heygen-ai-video-generator',
            ],

            // === Just Landed Tools ===
            [
                'name' => 'BIGVU', 'slug' => 'bigvu-ai',
                'description' => 'AI Teleprompter Tool, Caption Maker and Video Editor.',
                'category_slug' => 'video-3d', 'pricing' => 'paid', 'rating' => 4.8,
                'featured' => false, 'trending' => false, 'just_landed' => true,
                'visit_url' => 'https://www.toolpilot.ai/products/bigvu-ai',
            ],
            [
                'name' => 'SaneBox', 'slug' => 'sanebox',
                'description' => 'AI-Powered Email Management Tool.',
                'category_slug' => 'business-office', 'pricing' => 'paid', 'rating' => 5.0,
                'featured' => false, 'trending' => false, 'just_landed' => true,
                'visit_url' => 'https://www.toolpilot.ai/products/sanebox',
            ],

            // === More Popular Tools (Mixed flags) ===
            [
                'name' => 'Candy.ai', 'slug' => 'candy-ai',
                'description' => 'AI Companions – Create your own AI girlfriend or companion.',
                'category_slug' => 'entertainment-fun', 'pricing' => 'freemium', 'rating' => 5.0,
                'featured' => true, 'trending' => false, 'just_landed' => false,
                'visit_url' => 'https://www.toolpilot.ai/products/candy-ai',
            ],
            [
                'name' => 'Clothoff.net', 'slug' => 'clothoff-net',
                'description' => 'AI To Change Elements of Clothing From Image.',
                'category_slug' => 'images-photos', 'pricing' => 'paid', 'rating' => 4.6,
                'featured' => false, 'trending' => true, 'just_landed' => false,
                'visit_url' => 'https://www.toolpilot.ai/products/clothoff-net',
            ],
            [
                'name' => 'OpenArt', 'slug' => 'openart',
                'description' => 'AI Art & Image Creation Platform.',
                'category_slug' => 'images-photos', 'pricing' => 'freemium', 'rating' => 5.0,
                'featured' => true, 'trending' => false, 'just_landed' => false,
                'visit_url' => 'https://www.toolpilot.ai/products/openart',
            ],
            [
                'name' => 'AI Face Swap', 'slug' => 'ai-face-swap',
                'description' => 'All-in-one AI Face Swap Tool.',
                'category_slug' => 'images-photos', 'pricing' => 'free', 'rating' => 4.5,
                'featured' => false, 'trending' => false, 'just_landed' => true,
                'visit_url' => 'https://www.toolpilot.ai/products/ai-face-swap',
            ],

            // Additional 16+ tools (realistic from ToolPilot style)
            ['name' => 'Upmetrics', 'slug' => 'upmetrics', 'description' => 'AI Business Plan Generator for startups.', 'category_slug' => 'business-office', 'pricing' => 'paid', 'rating' => 4.9, 'featured' => true, 'trending' => false, 'just_landed' => false, 'visit_url' => 'https://www.toolpilot.ai/products/upmetrics'],
            ['name' => 'SurferSEO', 'slug' => 'surferseo', 'description' => 'AI-powered SEO content optimization tool.', 'category_slug' => 'seo', 'pricing' => 'paid', 'rating' => 4.8, 'featured' => false, 'trending' => true, 'just_landed' => false, 'visit_url' => 'https://www.toolpilot.ai/products/surferseo'],
            ['name' => 'Canva AI', 'slug' => 'canva-ai', 'description' => 'AI Design Tool with Magic Studio.', 'category_slug' => 'images-photos', 'pricing' => 'freemium', 'rating' => 5.0, 'featured' => true, 'trending' => false, 'just_landed' => false, 'visit_url' => 'https://www.toolpilot.ai/products/canva-ai'],
            ['name' => 'Notion AI', 'slug' => 'notion-ai', 'description' => 'AI-powered workspace and note-taking.', 'category_slug' => 'productivity', 'pricing' => 'freemium', 'rating' => 4.9, 'featured' => false, 'trending' => true, 'just_landed' => false, 'visit_url' => 'https://www.toolpilot.ai/products/notion-ai'],
            ['name' => 'ChatGPT', 'slug' => 'chatgpt', 'description' => 'Most popular AI conversational assistant.', 'category_slug' => 'ai-assistants-agents', 'pricing' => 'freemium', 'rating' => 5.0, 'featured' => true, 'trending' => true, 'just_landed' => false, 'visit_url' => 'https://www.toolpilot.ai/products/chatgpt'],
            ['name' => 'Luminar Neo', 'slug' => 'luminar-neo', 'description' => 'AI-Powered Photo Editing Software.', 'category_slug' => 'images-photos', 'pricing' => 'paid', 'rating' => 4.7, 'featured' => false, 'trending' => false, 'just_landed' => true, 'visit_url' => 'https://www.toolpilot.ai/products/luminar-neo'],
            ['name' => 'LinkWhisper', 'slug' => 'linkwhisper', 'description' => 'Internal Linking Optimization Tool for WordPress.', 'category_slug' => 'seo', 'pricing' => 'paid', 'rating' => 4.6, 'featured' => false, 'trending' => false, 'just_landed' => false, 'visit_url' => 'https://www.toolpilot.ai/products/linkwhisper'],
            ['name' => 'Petal', 'slug' => 'petal', 'description' => 'AI Sales and CRM assistant.', 'category_slug' => 'sales', 'pricing' => 'paid', 'rating' => 4.8, 'featured' => false, 'trending' => true, 'just_landed' => false, 'visit_url' => 'https://www.toolpilot.ai/products/petal'],
            ['name' => 'ReachOut', 'slug' => 'reachout', 'description' => 'AI-powered outreach and email automation.', 'category_slug' => 'marketing', 'pricing' => 'freemium', 'rating' => 4.5, 'featured' => false, 'trending' => false, 'just_landed' => true, 'visit_url' => 'https://www.toolpilot.ai/products/reachout'],
            ['name' => 'Databox', 'slug' => 'databox', 'description' => 'AI Business Analytics and Dashboard Tool.', 'category_slug' => 'business-office', 'pricing' => 'paid', 'rating' => 4.9, 'featured' => true, 'trending' => false, 'just_landed' => false, 'visit_url' => 'https://www.toolpilot.ai/products/databox'],
            ['name' => 'SalesCred PRO', 'slug' => 'salescred-pro', 'description' => 'AI Sales Enablement Platform.', 'category_slug' => 'sales', 'pricing' => 'paid', 'rating' => 4.7, 'featured' => false, 'trending' => true, 'just_landed' => false, 'visit_url' => 'https://www.toolpilot.ai/products/salescred-pro'],
            ['name' => 'Midjourney', 'slug' => 'midjourney', 'description' => 'Best AI Art and Image Generator.', 'category_slug' => 'images-photos', 'pricing' => 'paid', 'rating' => 5.0, 'featured' => true, 'trending' => true, 'just_landed' => false, 'visit_url' => 'https://www.toolpilot.ai/products/midjourney'],
            ['name' => 'ElevenLabs', 'slug' => 'elevenlabs', 'description' => 'AI Voice Generation and Text-to-Speech.', 'category_slug' => 'music-audio', 'pricing' => 'freemium', 'rating' => 4.9, 'featured' => false, 'trending' => false, 'just_landed' => true, 'visit_url' => 'https://www.toolpilot.ai/products/elevenlabs'],
            ['name' => 'Runway ML', 'slug' => 'runway-ml', 'description' => 'Advanced AI Video Generation Tool.', 'category_slug' => 'video-3d', 'pricing' => 'paid', 'rating' => 4.8, 'featured' => false, 'trending' => true, 'just_landed' => false, 'visit_url' => 'https://www.toolpilot.ai/products/runway-ml'],
            ['name' => 'Perplexity AI', 'slug' => 'perplexity-ai', 'description' => 'AI-powered Search Engine and Research Assistant.', 'category_slug' => 'ai-assistants-agents', 'pricing' => 'freemium', 'rating' => 4.9, 'featured' => true, 'trending' => false, 'just_landed' => false, 'visit_url' => 'https://www.toolpilot.ai/products/perplexity-ai'],
            ['name' => 'Jasper AI', 'slug' => 'jasper-ai', 'description' => 'AI Copywriting and Content Generation Tool.', 'category_slug' => 'text-content', 'pricing' => 'paid', 'rating' => 4.7, 'featured' => false, 'trending' => false, 'just_landed' => false, 'visit_url' => 'https://www.toolpilot.ai/products/jasper-ai'],
        ];

        $count = 0;

        foreach ($tools as $toolData) {
            $category = Category::where('slug', $toolData['category_slug'])->first();

            if (!$category) {
                $this->command->warn("⚠️ Category '{$toolData['category_slug']}' not found for tool: {$toolData['name']}");
                continue;
            }

            Tool::updateOrCreate(
                ['slug' => $toolData['slug']],
                [
                    'name'              => $toolData['name'],
                    'slug'              => $toolData['slug'],
                    'description'       => $toolData['description'],
                    'category_id'       => $category->id,
                    'pricing'           => $toolData['pricing'],
                    'rating'            => $toolData['rating'],
                    'featured'          => $toolData['featured'],
                    'trending'          => $toolData['trending'],
                    'just_landed'       => $toolData['just_landed'],
                    'is_top'            => $toolData['featured'] || $toolData['trending'],
                    'visit_url'         => $toolData['visit_url'],
                    'meta_title'        => $toolData['name'] . ' - ToolPilot AI',
                    'meta_description'  => Str::limit($toolData['description'], 160, '...'),
                    'features'          => ['AI Powered', 'Fast', 'Easy to use'],
                    'pros'              => ['High quality output', 'Time saving'],
                    'cons'              => ['Limited free version'],
                ]
            );

            $count++;
        }

        $this->command->info("✅ ToolSeeder completed successfully! {$count} tools seeded from ToolPilot.ai");
        $this->command->info("   → Featured, Trending, and Just Landed tools are now properly flagged.");
    }
}