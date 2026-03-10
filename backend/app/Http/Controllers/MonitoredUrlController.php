<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMonitoredUrlRequest;
use App\Http\Requests\UpdateMonitoredUrlRequest;
use App\Models\MonitoredUrl;
use App\Models\ScrapingTemplate;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MonitoredUrlController extends Controller
{
    public function index(): Response
    {
        $monitoredUrls = auth()->user()
            ->monitoredUrls()
            ->with('template')
            ->latest()
            ->get();

        return Inertia::render('MonitoredUrls/Index', [
            'monitoredUrls' => $monitoredUrls,
        ]);
    }

    public function create(): Response
    {
        $templates = ScrapingTemplate::all();

        return Inertia::render('MonitoredUrls/Create', [
            'templates' => $templates,
        ]);
    }

    public function store(StoreMonitoredUrlRequest $request): RedirectResponse
    {
        auth()->user()->monitoredUrls()->create([
            'url' => $request->url,
            'template_id' => $request->template_id,
            'keywords' => $request->keywords,
        ]);

        return redirect()->route('monitored-urls.index')
            ->with('success', '監視URLを登録しました');
    }

    public function edit(MonitoredUrl $monitoredUrl): Response
    {
        $this->authorize('update', $monitoredUrl);

        $templates = ScrapingTemplate::all();

        return Inertia::render('MonitoredUrls/Edit', [
            'monitoredUrl' => $monitoredUrl->load('template'),
            'templates' => $templates,
        ]);
    }

    public function update(UpdateMonitoredUrlRequest $request, MonitoredUrl $monitoredUrl): RedirectResponse
    {
        $monitoredUrl->update([
            'url' => $request->url,
            'template_id' => $request->template_id,
            'keywords' => $request->keywords,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('monitored-urls.index')
            ->with('success', '監視URLを更新しました');
    }

    public function destroy(MonitoredUrl $monitoredUrl): RedirectResponse
    {
        $this->authorize('delete', $monitoredUrl);

        $monitoredUrl->delete();

        return redirect()->route('monitored-urls.index')
            ->with('success', '監視URLを削除しました');
    }
}
