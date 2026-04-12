<?php

namespace Database\Seeders;

use App\Models\Post;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AiNewsSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $news = [
            [
                'title'     => 'Uncovering the Latent Potential of Boiling – For Energy, Space Exploration, and Beyond',
                'slug'      => 'uncovering-the-latent-potential-of-boiling-for-energy-space-exploration-and-beyond',
                'excerpt'   => 'Across centuries, the universally recognized process of boiling has found its applications in numerous industries.',
            ],
            [
                'title'     => 'MIT Reiterates Commitment to Biodiversity Conservation at UN Biodiversity Convention, COP16',
                'slug'      => 'mit-reiterates-commitment-to-biodiversity-conservation-at-un-biodiversity-convention-cop16',
                'excerpt'   => 'A delegation from the Massachusetts Institute of Technology (MIT) has strongly endorsed the importance of biodiversity conservation.',
            ],
            [
                'title'     => 'Unveiling the Power of Generative AI in Crafting Realistic 3D Shapes',
                'slug'      => 'unveiling-the-power-of-generative-ai-in-crafting-realistic-3d-shapes',
                'excerpt'   => 'Innovative breakthroughs continue to foster the potential of generative AI in 3D modeling.',
            ],
            [
                'title'     => 'Unleashing Ultrafast AI Computations with a Photonic Processor',
                'slug'      => 'unleashing-ultrafast-ai-computations-with-a-photonic-processor',
                'excerpt'   => 'New photonic processor technology promises ultrafast AI computations.',
            ],
            [
                'title'     => 'Cutting-Edge AI Tool Crafts Realistic Flood Predictive Satellite Images',
                'slug'      => 'cutting-edge-ai-tool-crafts-realistic-flood-predictive-satellite-images',
                'excerpt'   => 'AI tool revolutionizes flood prediction with realistic satellite imagery.',
            ],
        ];

        $count = 0;

        foreach ($news as $item) {
            Post::updateOrCreate(
                ['slug' => $item['slug']],
                [
                    'title'             => $item['title'],
                    'slug'              => $item['slug'],
                    'type'              => 'news',                    // ← Must match your enum: 'blog', 'news', or 'guide'
                    'category'          => 'AI News',
                    'tags'              => ['ai', 'news', 'breakthrough'],
                    'excerpt'           => $item['excerpt'],
                    'content'           => $item['excerpt'] . "\n\nFull article available on ToolPilot.ai.",
                    'image'             => null,
                    'image_url'         => null,
                    'image_public_id'   => null,
                    'image_alt'         => null,
                    'image_title'       => null,
                    'meta_title'        => $item['title'],
                    'meta_description'  => Str::limit($item['excerpt'], 160, '...'),
                    'published'         => true,
                    'published_at'      => now()->subDays(rand(1, 30)),
                ]
            );

            $count++;
        }

        $this->command->info("✅ AiNewsSeeder completed successfully! {$count} AI News articles seeded.");
    }
}