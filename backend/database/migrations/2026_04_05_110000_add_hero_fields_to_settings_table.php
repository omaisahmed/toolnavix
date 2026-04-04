<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->string('hero_badge', 120)->nullable()->after('footer_text');
            $table->string('hero_title', 255)->nullable()->after('hero_badge');
            $table->text('hero_subtitle')->nullable()->after('hero_title');
            $table->string('hero_search_placeholder', 255)->nullable()->after('hero_subtitle');
            $table->string('hero_search_button_text', 80)->nullable()->after('hero_search_placeholder');
            $table->string('hero_tag_1', 80)->nullable()->after('hero_search_button_text');
            $table->string('hero_tag_2', 80)->nullable()->after('hero_tag_1');
            $table->string('hero_tag_3', 80)->nullable()->after('hero_tag_2');
        });
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn([
                'hero_badge',
                'hero_title',
                'hero_subtitle',
                'hero_search_placeholder',
                'hero_search_button_text',
                'hero_tag_1',
                'hero_tag_2',
                'hero_tag_3',
            ]);
        });
    }
};

