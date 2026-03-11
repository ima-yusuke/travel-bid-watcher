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
        $urls = auth()->user()
            ->monitoredUrls()
            ->with('template')
            ->latest()
            ->paginate(10);

        return Inertia::render('MonitoredUrls/Index', [
            'urls' => $urls,
            'templates' => ScrapingTemplate::all(),
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
            'name' => $request->name,
            'url' => $request->url,
            'template_id' => $request->template_id,
            'notification_email' => $request->notification_email,
            'keywords' => $request->keywords ? array_filter($request->keywords) : null,
        ]);

        return redirect()->route('monitored-urls.index')
            ->with('success', '監視URLを登録しました');
    }

    public function edit(MonitoredUrl $monitoredUrl): Response
    {
        $this->authorize('update', $monitoredUrl);

        $templates = ScrapingTemplate::all();

        return Inertia::render('MonitoredUrls/Edit', [
            'url' => $monitoredUrl->load('template'),
            'templates' => $templates,
        ]);
    }

    public function update(UpdateMonitoredUrlRequest $request, MonitoredUrl $monitoredUrl): RedirectResponse
    {
        $monitoredUrl->update([
            'name' => $request->name,
            'url' => $request->url,
            'template_id' => $request->template_id,
            'notification_email' => $request->notification_email,
            'keywords' => $request->keywords ? array_filter($request->keywords) : null,
            'status' => $request->status,
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
