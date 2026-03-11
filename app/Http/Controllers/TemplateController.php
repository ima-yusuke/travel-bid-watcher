<?php

namespace App\Http\Controllers;

use App\Models\ScrapingTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TemplateController extends Controller
{
    public function index()
    {
        $templates = ScrapingTemplate::withCount('monitoredUrls')
            ->latest()
            ->paginate(10);

        return Inertia::render('Templates/Index', [
            'templates' => $templates,
        ]);
    }

    public function create()
    {
        return Inertia::render('Templates/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'selectors' => 'required|array',
            'selectors.row' => 'required|string|max:255',
            'selectors.title' => 'nullable|string|max:255',
            'selectors.description' => 'nullable|string|max:255',
            'selectors.deadline' => 'nullable|string|max:255',
            'selectors.amount' => 'nullable|string|max:255',
            'selectors.location' => 'nullable|string|max:255',
            'selectors.url' => 'nullable|string|max:255',
        ]);

        ScrapingTemplate::create($validated);

        return redirect()->route('templates.index')
            ->with('success', 'テンプレートを作成しました');
    }

    public function edit(ScrapingTemplate $template)
    {
        return Inertia::render('Templates/Edit', [
            'template' => $template,
        ]);
    }

    public function update(Request $request, ScrapingTemplate $template)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'selectors' => 'required|array',
            'selectors.row' => 'required|string|max:255',
            'selectors.title' => 'nullable|string|max:255',
            'selectors.description' => 'nullable|string|max:255',
            'selectors.deadline' => 'nullable|string|max:255',
            'selectors.amount' => 'nullable|string|max:255',
            'selectors.location' => 'nullable|string|max:255',
            'selectors.url' => 'nullable|string|max:255',
        ]);

        $template->update($validated);

        return redirect()->route('templates.index')
            ->with('success', 'テンプレートを更新しました');
    }

    public function destroy(ScrapingTemplate $template)
    {
        // テンプレートを使用している監視URLがある場合は削除不可
        if ($template->monitoredUrls()->count() > 0) {
            return back()->with('error', 'このテンプレートは使用中のため削除できません');
        }

        $template->delete();

        return redirect()->route('templates.index')
            ->with('success', 'テンプレートを削除しました');
    }
}
