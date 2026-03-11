<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetectedOpportunity extends Model
{
    use HasFactory;

    protected $fillable = [
        'monitored_url_id',
        'title',
        'url',
        'published_date',
        'department',
        'matched_keywords',
        'content_hash',
        'notified_at',
    ];

    protected $casts = [
        'matched_keywords' => 'array',
        'published_date' => 'date',
        'notified_at' => 'datetime',
    ];

    public function monitoredUrl(): BelongsTo
    {
        return $this->belongsTo(MonitoredUrl::class);
    }
}
