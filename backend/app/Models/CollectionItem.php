<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CollectionItem extends Model
{
    use HasFactory;

    protected $fillable = ['collection_id', 'tool_id'];

    public function collection()
    {
        return $this->belongsTo(Collection::class);
    }

    public function tool()
    {
        return $this->belongsTo(Tool::class);
    }
}