<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MonitoredUrl extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'template_id',
        'url',
        'keywords',
        'is_active',
        'last_scraped_at',
    ];

    protected $casts = [
        'keywords' => 'array',
        'is_active' => 'boolean',
        'last_scraped_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(ScrapingTemplate::class, 'template_id');
    }

    public function detectedOpportunities(): HasMany
    {
        return $this->hasMany(DetectedOpportunity::class);
    }
}
