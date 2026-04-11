<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tool extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'category_id',
        'pricing',
        'rating',
        'featured',
        'trending',
        'just_landed',
        'is_top',
        'visit_url',
        'logo',
        'logo_url',
        'logo_public_id',
        'features',
        'pros',
        'cons',
    ];

    protected $casts = [
        'featured' => 'boolean',
        'trending' => 'boolean',
        'just_landed' => 'boolean',
        'is_top' => 'boolean',
        'features' => 'array',
        'pros' => 'array',
        'cons' => 'array',
        'rating' => 'float',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function bookmarks()
    {
        return $this->hasMany(Bookmark::class);
    }

    public function collectionItems()
    {
        return $this->hasMany(CollectionItem::class);
    }

    public function views()
    {
        return $this->hasMany(ToolView::class);
    }
}
