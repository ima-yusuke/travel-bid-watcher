<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule the scraper to run 3 times daily
Schedule::command('scrape:urls')
    ->dailyAt('08:00')
    ->timezone('Asia/Tokyo');

Schedule::command('scrape:urls')
    ->dailyAt('13:00')
    ->timezone('Asia/Tokyo');

Schedule::command('scrape:urls')
    ->dailyAt('18:00')
    ->timezone('Asia/Tokyo');
