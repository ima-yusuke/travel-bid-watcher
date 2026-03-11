<?php

namespace App\Http\Controllers;

use App\Models\Opportunity;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OpportunityController extends Controller
{
    /**
     * Display a listing of opportunities
     */
    public function index(Request $request)
    {
        $query = Opportunity::with(['monitoredUrl', 'monitoredUrl.template'])
            ->whereHas('monitoredUrl', function ($q) {
                $q->where('user_id', auth()->id());
            })
            ->orderByRaw('COALESCE(deadline, created_at) DESC');

        // Filter by monitored URL if specified
        if ($request->filled('monitored_url_id')) {
            $query->where('monitored_url_id', $request->monitored_url_id);
        }

        // Filter by date range if specified
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Search by title
        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $opportunities = $query->paginate(20)->withQueryString();

        // Get user's monitored URLs for filter dropdown
        $monitoredUrls = auth()->user()->monitoredUrls()
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Opportunities/Index', [
            'opportunities' => $opportunities,
            'monitoredUrls' => $monitoredUrls,
            'filters' => $request->only(['monitored_url_id', 'date_from', 'date_to', 'search']),
        ]);
    }

    /**
     * Display the specified opportunity
     */
    public function show(Opportunity $opportunity)
    {
        // Ensure user owns this opportunity's monitored URL
        if ($opportunity->monitoredUrl->user_id !== auth()->id()) {
            abort(403);
        }

        $opportunity->load(['monitoredUrl', 'monitoredUrl.template']);

        return Inertia::render('Opportunities/Show', [
            'opportunity' => $opportunity,
        ]);
    }
}
