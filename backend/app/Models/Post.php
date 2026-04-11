<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'type',
        'category',
        'tags',
        'excerpt',
        'image',
        'image_url',
        'image_public_id',
        'content',
        'meta_title',
        'meta_description',
        'published',
        'published_at',
    ];

    protected $casts = [
        'tags' => 'array',
        'published' => 'boolean',
        'published_at' => 'datetime',
    ];
}
