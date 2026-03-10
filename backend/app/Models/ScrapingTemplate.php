<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScrapingTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'list_selector',
        'title_selector',
        'date_selector',
        'link_selector',
        'department_selector',
    ];

    public function monitoredUrls(): HasMany
    {
        return $this->hasMany(MonitoredUrl::class, 'template_id');
    }
}
