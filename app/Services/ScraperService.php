<?php

namespace App\Services;

use App\Models\MonitoredUrl;
use App\Models\Opportunity;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\DomCrawler\Crawler;

class ScraperService
{
    /**
     * Scrape a monitored URL and extract opportunities
     */
    public function scrape(MonitoredUrl $monitoredUrl): array
    {
        try {
            // Fetch the HTML content
            $response = Http::timeout(30)
                ->withUserAgent('Mozilla/5.0 (compatible; TravelBidWatcher/1.0)')
                ->get($monitoredUrl->url);

            if (!$response->successful()) {
                throw new \Exception("HTTP request failed with status: {$response->status()}");
            }

            $html = $response->body();

            // Parse opportunities using the template
            $opportunities = $this->parseOpportunities($html, $monitoredUrl);

            // Store new opportunities and track changes
            $newOpportunities = $this->storeOpportunities($opportunities, $monitoredUrl);

            // Update monitored URL status
            $monitoredUrl->update([
                'last_checked_at' => now(),
                'last_error' => null,
                'status' => 'active',
            ]);

            Log::info("Scraped {$monitoredUrl->url}: Found " . count($opportunities) . " total, " . count($newOpportunities) . " new");

            return [
                'success' => true,
                'total' => count($opportunities),
                'new' => count($newOpportunities),
                'opportunities' => $newOpportunities,
            ];
        } catch (\Exception $e) {
            // Log error and update monitored URL
            Log::error("Scraping failed for {$monitoredUrl->url}: " . $e->getMessage());

            $monitoredUrl->update([
                'last_checked_at' => now(),
                'last_error' => $e->getMessage(),
                'status' => 'error',
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Parse HTML and extract opportunities using template selectors
     */
    protected function parseOpportunities(string $html, MonitoredUrl $monitoredUrl): array
    {
        $crawler = new Crawler($html);
        $template = $monitoredUrl->template;
        $opportunities = [];

        // Get all opportunity rows/items based on template selector
        $rowSelector = $template->selectors['row'] ?? 'tr';

        $crawler->filter($rowSelector)->each(function (Crawler $node) use (&$opportunities, $template) {
            try {
                $opportunity = $this->extractOpportunityData($node, $template);

                // Only add if we have at least a title
                if (!empty($opportunity['title'])) {
                    $opportunities[] = $opportunity;
                }
            } catch (\Exception $e) {
                Log::warning("Failed to parse opportunity row: " . $e->getMessage());
            }
        });

        return $opportunities;
    }

    /**
     * Extract individual opportunity data from a DOM node
     */
    protected function extractOpportunityData(Crawler $node, $template): array
    {
        $selectors = $template->selectors;

        $data = [
            'title' => $this->extractText($node, $selectors['title'] ?? null),
            'description' => $this->extractText($node, $selectors['description'] ?? null),
            'deadline' => $this->extractText($node, $selectors['deadline'] ?? null),
            'amount' => $this->extractText($node, $selectors['amount'] ?? null),
            'location' => $this->extractText($node, $selectors['location'] ?? null),
            'url' => $this->extractAttribute($node, $selectors['url'] ?? null, 'href'),
        ];

        // Parse deadline if present
        if ($data['deadline']) {
            $data['deadline'] = $this->parseDeadline($data['deadline']);
        }

        return $data;
    }

    /**
     * Extract text content using CSS selector
     */
    protected function extractText(Crawler $node, ?string $selector): ?string
    {
        if (!$selector) {
            return null;
        }

        try {
            $filtered = $node->filter($selector);
            if ($filtered->count() > 0) {
                return trim($filtered->text());
            }
        } catch (\Exception $e) {
            // Selector didn't match, return null
        }

        return null;
    }

    /**
     * Extract attribute value using CSS selector
     */
    protected function extractAttribute(Crawler $node, ?string $selector, string $attribute): ?string
    {
        if (!$selector) {
            return null;
        }

        try {
            $filtered = $node->filter($selector);
            if ($filtered->count() > 0) {
                return trim($filtered->attr($attribute) ?? '');
            }
        } catch (\Exception $e) {
            // Selector didn't match, return null
        }

        return null;
    }

    /**
     * Parse deadline string to datetime
     */
    protected function parseDeadline(string $deadlineText): ?string
    {
        // Japanese era conversion
        if (preg_match('/令和(\d{1,2})年(\d{1,2})月(\d{1,2})日/', $deadlineText, $matches)) {
            $year = 2018 + (int)$matches[1]; // 令和元年 = 2019
            return sprintf('%04d-%02d-%02d', $year, $matches[2], $matches[3]);
        }

        if (preg_match('/平成(\d{1,2})年(\d{1,2})月(\d{1,2})日/', $deadlineText, $matches)) {
            $year = 1988 + (int)$matches[1]; // 平成元年 = 1989
            return sprintf('%04d-%02d-%02d', $year, $matches[2], $matches[3]);
        }

        // Try common date formats
        $patterns = [
            '/(\d{4})年(\d{1,2})月(\d{1,2})日/' => function ($m) {
                return sprintf('%04d-%02d-%02d', $m[1], $m[2], $m[3]);
            },
            '/(\d{4})\/(\d{1,2})\/(\d{1,2})/' => function ($m) {
                return sprintf('%04d-%02d-%02d', $m[1], $m[2], $m[3]);
            },
            '/(\d{4})-(\d{1,2})-(\d{1,2})/' => function ($m) {
                return sprintf('%04d-%02d-%02d', $m[1], $m[2], $m[3]);
            },
        ];

        foreach ($patterns as $pattern => $formatter) {
            if (preg_match($pattern, $deadlineText, $matches)) {
                return $formatter($matches);
            }
        }

        return null;
    }

    /**
     * Store opportunities and return new ones
     */
    protected function storeOpportunities(array $opportunities, MonitoredUrl $monitoredUrl): array
    {
        $newOpportunities = [];

        foreach ($opportunities as $opportunityData) {
            // Filter by keywords if set
            if (!$this->matchesKeywords($opportunityData, $monitoredUrl->keywords)) {
                continue;
            }

            // Create a unique identifier based on title and URL
            $identifier = md5($opportunityData['title'] . ($opportunityData['url'] ?? ''));

            // Check if opportunity already exists
            $existing = Opportunity::where('monitored_url_id', $monitoredUrl->id)
                ->where('identifier', $identifier)
                ->first();

            if (!$existing) {
                // Create new opportunity
                $opportunity = Opportunity::create([
                    'monitored_url_id' => $monitoredUrl->id,
                    'identifier' => $identifier,
                    'title' => $opportunityData['title'],
                    'description' => $opportunityData['description'],
                    'deadline' => $opportunityData['deadline'],
                    'amount' => $opportunityData['amount'],
                    'location' => $opportunityData['location'],
                    'url' => $opportunityData['url'],
                    'data' => $opportunityData,
                ]);

                $newOpportunities[] = $opportunity;
            } else {
                // Update last seen timestamp
                $existing->touch();
            }
        }

        return $newOpportunities;
    }

    /**
     * Check if opportunity matches any of the keywords
     */
    protected function matchesKeywords(array $opportunityData, ?array $keywords): bool
    {
        // If no keywords set, match everything
        if (empty($keywords)) {
            return true;
        }

        // Filter out empty keywords
        $keywords = array_filter($keywords, fn($k) => !empty(trim($k)));

        if (empty($keywords)) {
            return true;
        }

        $title = $opportunityData['title'] ?? '';
        $description = $opportunityData['description'] ?? '';

        // Check if any keyword is found in title or description
        foreach ($keywords as $keyword) {
            $keyword = trim($keyword);
            if (empty($keyword)) {
                continue;
            }

            // Case-insensitive search in title and description
            if (mb_stripos($title, $keyword) !== false || mb_stripos($description, $keyword) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Scrape all active monitored URLs
     */
    public function scrapeAll(): array
    {
        $results = [];

        $monitoredUrls = MonitoredUrl::where('status', 'active')
            ->with('template')
            ->get();

        foreach ($monitoredUrls as $monitoredUrl) {
            $results[$monitoredUrl->id] = $this->scrape($monitoredUrl);

            // Add a small delay between requests to be polite
            sleep(2);
        }

        return $results;
    }
}
