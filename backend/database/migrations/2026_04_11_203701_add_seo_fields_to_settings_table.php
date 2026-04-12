<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->string('site_title')->nullable();
            $table->text('default_meta_description')->nullable();
            $table->string('logo_alt')->nullable();
            $table->string('logo_title')->nullable();
            $table->string('favicon_alt')->nullable();
            $table->string('favicon_title')->nullable();
            $table->string('social_image_url')->nullable();
            $table->string('social_image_public_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn(['site_title', 'default_meta_description', 'logo_alt', 'logo_title', 'favicon_alt', 'favicon_title', 'social_image_url', 'social_image_public_id']);
        });
    }
};
