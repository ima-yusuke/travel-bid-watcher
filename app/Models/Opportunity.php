<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Opportunity extends Model
{
    use HasFactory;

    protected $fillable = [
        'monitored_url_id',
        'identifier',
        'title',
        'description',
        'deadline',
        'amount',
        'location',
        'url',
        'data',
    ];

    protected $casts = [
        'data' => 'array',
        'deadline' => 'date',
    ];

    protected $appends = [
        'full_url',
    ];

    public function monitoredUrl(): BelongsTo
    {
        return $this->belongsTo(MonitoredUrl::class);
    }

    /**
     * Get the full URL by combining the monitored URL base and the relative path
     */
    public function getFullUrlAttribute(): ?string
    {
        if (!$this->url || !$this->monitoredUrl) {
            return null;
        }

        $baseUrl = $this->monitoredUrl->url;
        $relativePath = $this->url;

        // Parse the base URL to get the scheme and host
        $parsedUrl = parse_url($baseUrl);

        if (!isset($parsedUrl['scheme']) || !isset($parsedUrl['host'])) {
            return null;
        }

        // Construct the full URL
        $fullUrl = $parsedUrl['scheme'] . '://' . $parsedUrl['host'];

        // Add port if specified
        if (isset($parsedUrl['port'])) {
            $fullUrl .= ':' . $parsedUrl['port'];
        }

        // Add the relative path (ensure it starts with /)
        if (!str_starts_with($relativePath, '/')) {
            $relativePath = '/' . $relativePath;
        }

        $fullUrl .= $relativePath;

        return $fullUrl;
    }
}
