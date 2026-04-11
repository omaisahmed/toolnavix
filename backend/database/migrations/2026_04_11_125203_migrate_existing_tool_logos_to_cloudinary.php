<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Tool;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Clean up existing tools with temp paths or invalid local paths
        Tool::where('logo', 'like', '%temp%')
            ->orWhere('logo', 'like', '%storage%')
            ->update(['logo' => null]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse this cleanup migration
    }
};
