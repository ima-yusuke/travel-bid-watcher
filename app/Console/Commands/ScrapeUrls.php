<?php

namespace App\Console\Commands;

use App\Services\ScraperService;
use App\Mail\NewOpportunitiesNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class ScrapeUrls extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'scrape:urls {--url-id= : Specific monitored URL ID to scrape}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scrape all active monitored URLs for procurement opportunities';

    /**
     * Execute the console command.
     */
    public function handle(ScraperService $scraper)
    {
        $this->info('Starting URL scraping...');

        $urlId = $this->option('url-id');

        if ($urlId) {
            // Scrape specific URL
            $monitoredUrl = \App\Models\MonitoredUrl::find($urlId);

            if (!$monitoredUrl) {
                $this->error("Monitored URL with ID {$urlId} not found.");
                return 1;
            }

            $this->info("Scraping: {$monitoredUrl->name}");
            $result = $scraper->scrape($monitoredUrl);

            $this->displayResult($monitoredUrl->name, $result);

            if ($result['success'] && count($result['opportunities']) > 0) {
                $this->sendNotification($monitoredUrl, $result['opportunities']);
            }
        } else {
            // Scrape all active URLs
            $results = $scraper->scrapeAll();

            foreach ($results as $urlId => $result) {
                $monitoredUrl = \App\Models\MonitoredUrl::find($urlId);
                $this->displayResult($monitoredUrl->name, $result);

                if ($result['success'] && count($result['opportunities']) > 0) {
                    $this->sendNotification($monitoredUrl, $result['opportunities']);
                }
            }
        }

        $this->info('Scraping completed!');
        return 0;
    }

    /**
     * Display scraping result
     */
    protected function displayResult(string $name, array $result)
    {
        if ($result['success']) {
            $this->line("✓ {$name}: {$result['total']} total, {$result['new']} new");
        } else {
            $this->error("✗ {$name}: {$result['error']}");
        }
    }

    /**
     * Send email notification for new opportunities
     */
    protected function sendNotification($monitoredUrl, array $opportunities)
    {
        $email = $monitoredUrl->notification_email ?? $monitoredUrl->user->email;

        if ($email) {
            Mail::to($email)->send(new NewOpportunitiesNotification($monitoredUrl, $opportunities));
            $this->info("  → Notification sent to {$email}");
        }
    }
}
