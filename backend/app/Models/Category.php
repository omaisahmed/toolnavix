<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'description', 'icon', 'meta_title', 'meta_description', 'meta_keywords', 'icon_alt', 'icon_title'];

    public function tools()
    {
        return $this->hasMany(Tool::class);
    }
}
