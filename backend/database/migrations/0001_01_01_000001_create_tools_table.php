<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tools', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->enum('pricing', ['free', 'paid', 'freemium'])->default('freemium');
            $table->decimal('rating', 3, 2)->default(0.0);
            $table->boolean('featured')->default(false);
            $table->boolean('trending')->default(false);
            $table->boolean('just_landed')->default(false);
            $table->string('visit_url');
            $table->string('logo')->nullable();
            $table->json('features')->nullable();
            $table->json('pros')->nullable();
            $table->json('cons')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tools');
    }
};