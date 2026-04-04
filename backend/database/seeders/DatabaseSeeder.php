<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@admin.com',
            'is_admin' => true,
            'password' => bcrypt('password'),
        ]);

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        $categories = [
            ['name' => 'AI Writing', 'slug' => 'ai-writing', 'description' => 'Tools for content writing and copy.'],
            ['name' => 'Video', 'slug' => 'video', 'description' => 'Video creation and editing AI tools.'],
            ['name' => 'Code', 'slug' => 'code', 'description' => 'AI code assistants and debugging tools.'],
            ['name' => 'Design', 'slug' => 'design', 'description' => 'Design and image generation tools.'],
        ];

        foreach ($categories as $categoryData) {
            $category = \App\Models\Category::create($categoryData);

            \App\Models\Tool::create([
                'name' => $category->name.' Pro',
                'slug' => str()->slug($category->name.' Pro'),
                'description' => 'The best '.$category->name.' tool for rapid workflow.',
                'category_id' => $category->id,
                'pricing' => 'freemium',
                'rating' => 4.5,
                'featured' => true,
                'trending' => true,
                'just_landed' => true,
                'visit_url' => 'https://example.com',
                'logo' => null,
                'features' => ['Fast', 'Accurate', 'Integrated'],
                'pros' => ['Easy to use', 'High quality output'],
                'cons' => ['Limited free tier'],
            ]);
        }
    }
}
