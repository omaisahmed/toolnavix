<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $table = 'settings';
    protected $fillable = [
        'logo_url',
        'favicon_url',
        'footer_text',
        'hero_badge',
        'hero_title',
        'hero_subtitle',
        'hero_search_placeholder',
        'hero_search_button_text',
        'hero_tag_1',
        'hero_tag_2',
        'hero_tag_3',
    ];
}
