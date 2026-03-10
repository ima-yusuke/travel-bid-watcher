# 公募情報モニタリングシステム Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a web scraping system that monitors government procurement websites and sends email notifications when matching opportunities are found.

**Architecture:** Laravel 11 backend with React 18 + Inertia.js frontend. Template-based HTML scraping using Symfony DOMCrawler. Scheduled tasks run 3x daily, batch notifications per user. Deployed on shared hosting (no queues/redis).

**Tech Stack:** Laravel 11, React 18, Inertia.js 1.x, Tailwind CSS 3, MySQL 5.7+, Symfony DOMCrawler, GuzzleHttp

---

## Task 1: Project Setup

**Files:**
- Create: entire Laravel project structure
- Create: `README.md`
- Create: `.gitignore`

**Step 1: Initialize Laravel project**

```bash
cd /Users/yusuke/【個人】開発/travel-bid-watcher
composer create-project laravel/laravel backend "11.*"
cd backend
```

Expected: Laravel 11 installed in `backend/` directory

**Step 2: Install Laravel Breeze with React**

```bash
composer require laravel/breeze --dev
php artisan breeze:install react
```

Select:
- React with Inertia
- Dark mode support: no
- TypeScript: no
- ESLint: yes (if prompted)

Expected: Inertia + React scaffold installed

**Step 3: Install additional dependencies**

```bash
# PHP dependencies
composer require guzzlehttp/guzzle
composer require symfony/dom-crawler
composer require symfony/css-selector

# Frontend dependencies
npm install
```

Expected: All dependencies installed

**Step 4: Configure environment**

Create `.env` with:

```env
APP_NAME="公募情報モニタリング"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=travel_bid_watcher
DB_USERNAME=root
DB_PASSWORD=

MAIL_MAILER=log
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="${APP_NAME}"
```

**Step 5: Generate app key and run initial migration**

```bash
php artisan key:generate
php artisan migrate
```

Expected: `users`, `password_resets`, etc. tables created

**Step 6: Verify dev server works**

```bash
# Terminal 1
php artisan serve

# Terminal 2
npm run dev
```

Visit http://localhost:8000
Expected: Laravel welcome page + Breeze auth working

**Step 7: Create README**

Create `README.md`:

```markdown
# 公募情報モニタリングシステム (Travel Bid Watcher)

近畿日本ツーリスト向けの公募情報自動監視システム

## セットアップ

\`\`\`bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
\`\`\`

## 開発サーバー

\`\`\`bash
php artisan serve
npm run dev
\`\`\`

## テスト

\`\`\`bash
php artisan test
\`\`\`

## 設計書

`docs/plans/2026-03-10-procurement-monitoring-system-design.md` を参照
```

**Step 8: Commit**

```bash
git add .
git commit -m "feat: initialize Laravel 11 + React + Inertia project

- Laravel 11 with Breeze authentication
- React 18 + Inertia.js frontend
- Tailwind CSS styling
- Guzzle + DOMCrawler for scraping

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Database Migrations

**Files:**
- Create: `database/migrations/XXXX_create_scraping_templates_table.php`
- Create: `database/migrations/XXXX_create_monitored_urls_table.php`
- Create: `database/migrations/XXXX_create_detected_opportunities_table.php`

**Step 1: Create scraping_templates migration**

```bash
php artisan make:migration create_scraping_templates_table
```

Edit `database/migrations/XXXX_create_scraping_templates_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scraping_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('list_selector');
            $table->string('title_selector');
            $table->string('date_selector');
            $table->string('link_selector');
            $table->string('department_selector')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scraping_templates');
    }
};
```

**Step 2: Create monitored_urls migration**

```bash
php artisan make:migration create_monitored_urls_table
```

Edit `database/migrations/XXXX_create_monitored_urls_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monitored_urls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('template_id')->constrained('scraping_templates')->onDelete('restrict');
            $table->text('url');
            $table->json('keywords');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_scraped_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monitored_urls');
    }
};
```

**Step 3: Create detected_opportunities migration**

```bash
php artisan make:migration create_detected_opportunities_table
```

Edit `database/migrations/XXXX_create_detected_opportunities_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('detected_opportunities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('monitored_url_id')->constrained()->onDelete('cascade');
            $table->text('title');
            $table->text('url');
            $table->date('published_date')->nullable();
            $table->string('department')->nullable();
            $table->json('matched_keywords');
            $table->string('content_hash', 64);
            $table->timestamp('notified_at')->nullable();
            $table->timestamps();

            $table->index('monitored_url_id');
            $table->index('created_at');
            $table->unique(['monitored_url_id', 'content_hash']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('detected_opportunities');
    }
};
```

**Step 4: Run migrations**

```bash
php artisan migrate
```

Expected: All 3 tables created successfully

**Step 5: Verify migrations**

```bash
php artisan migrate:status
```

Expected: All migrations show "Ran"

**Step 6: Commit**

```bash
git add database/migrations/
git commit -m "feat: add database migrations for core tables

- scraping_templates: CSS selector configs
- monitored_urls: user URL registrations
- detected_opportunities: scraped results with deduplication

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Create Models

**Files:**
- Create: `app/Models/ScrapingTemplate.php`
- Create: `app/Models/MonitoredUrl.php`
- Create: `app/Models/DetectedOpportunity.php`

**Step 1: Create ScrapingTemplate model**

```bash
php artisan make:model ScrapingTemplate
```

Edit `app/Models/ScrapingTemplate.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScrapingTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'list_selector',
        'title_selector',
        'date_selector',
        'link_selector',
        'department_selector',
    ];

    public function monitoredUrls(): HasMany
    {
        return $this->hasMany(MonitoredUrl::class, 'template_id');
    }
}
```

**Step 2: Create MonitoredUrl model**

```bash
php artisan make:model MonitoredUrl
```

Edit `app/Models/MonitoredUrl.php`:

```php
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
```

**Step 3: Create DetectedOpportunity model**

```bash
php artisan make:model DetectedOpportunity
```

Edit `app/Models/DetectedOpportunity.php`:

```php
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
```

**Step 4: Update User model**

Edit `app/Models/User.php` - add relationship:

```php
use Illuminate\Database\Eloquent\Relations\HasMany;

// Add inside User class
public function monitoredUrls(): HasMany
{
    return $this->hasMany(MonitoredUrl::class);
}
```

**Step 5: Commit**

```bash
git add app/Models/
git commit -m "feat: add Eloquent models with relationships

- ScrapingTemplate
- MonitoredUrl
- DetectedOpportunity
- Updated User model

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Create Template Seeder

**Files:**
- Create: `database/seeders/ScrapingTemplateSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`

**Step 1: Create seeder**

```bash
php artisan make:seeder ScrapingTemplateSeeder
```

Edit `database/seeders/ScrapingTemplateSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\ScrapingTemplate;
use Illuminate\Database\Seeder;

class ScrapingTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'name' => '三重県型',
                'list_selector' => 'table tr',
                'title_selector' => 'td.news-a a',
                'date_selector' => 'td.date-a',
                'link_selector' => 'td.news-a a',
                'department_selector' => 'td.from-a a',
            ],
            [
                'name' => '汎用型（テーブル）',
                'list_selector' => 'table tbody tr',
                'title_selector' => 'td:nth-child(2)',
                'date_selector' => 'td:nth-child(1)',
                'link_selector' => 'a',
                'department_selector' => 'td:nth-child(3)',
            ],
        ];

        foreach ($templates as $template) {
            ScrapingTemplate::create($template);
        }
    }
}
```

**Step 2: Register seeder**

Edit `database/seeders/DatabaseSeeder.php`:

```php
public function run(): void
{
    $this->call([
        ScrapingTemplateSeeder::class,
    ]);
}
```

**Step 3: Run seeder**

```bash
php artisan db:seed
```

Expected: 2 templates created

**Step 4: Verify**

```bash
php artisan tinker
```

Run:
```php
\App\Models\ScrapingTemplate::all();
exit
```

Expected: Shows 2 templates

**Step 5: Commit**

```bash
git add database/seeders/
git commit -m "feat: add scraping template seeder

- Mie Prefecture type
- Generic table type

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Create MonitoredUrl Policy

**Files:**
- Create: `app/Policies/MonitoredUrlPolicy.php`
- Modify: `app/Providers/AuthServiceProvider.php`

**Step 1: Generate policy**

```bash
php artisan make:policy MonitoredUrlPolicy --model=MonitoredUrl
```

Edit `app/Policies/MonitoredUrlPolicy.php`:

```php
<?php

namespace App\Policies;

use App\Models\MonitoredUrl;
use App\Models\User;

class MonitoredUrlPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, MonitoredUrl $monitoredUrl): bool
    {
        return $user->id === $monitoredUrl->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, MonitoredUrl $monitoredUrl): bool
    {
        return $user->id === $monitoredUrl->user_id;
    }

    public function delete(User $user, MonitoredUrl $monitoredUrl): bool
    {
        return $user->id === $monitoredUrl->user_id;
    }
}
```

**Step 2: Commit**

```bash
git add app/Policies/
git commit -m "feat: add authorization policy for monitored URLs

Users can only edit/delete their own URLs

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Create MonitoredUrl Controller

**Files:**
- Create: `app/Http/Controllers/MonitoredUrlController.php`
- Create: `app/Http/Requests/StoreMonitoredUrlRequest.php`
- Create: `app/Http/Requests/UpdateMonitoredUrlRequest.php`
- Modify: `routes/web.php`

**Step 1: Create form request for store**

```bash
php artisan make:request StoreMonitoredUrlRequest
```

Edit `app/Http/Requests/StoreMonitoredUrlRequest.php`:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMonitoredUrlRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'url' => 'required|url|max:2048',
            'template_id' => 'required|exists:scraping_templates,id',
            'keywords' => 'required|array|min:1|max:20',
            'keywords.*' => 'required|string|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'url.required' => '監視対象URLを入力してください',
            'url.url' => '有効なURLを入力してください',
            'template_id.required' => 'サイトタイプを選択してください',
            'template_id.exists' => '無効なサイトタイプです',
            'keywords.required' => 'キーワードを1つ以上入力してください',
            'keywords.min' => 'キーワードを1つ以上入力してください',
            'keywords.max' => 'キーワードは20個までです',
            'keywords.*.required' => 'キーワードを入力してください',
            'keywords.*.max' => 'キーワードは100文字以内です',
        ];
    }
}
```

**Step 2: Create form request for update**

```bash
php artisan make:request UpdateMonitoredUrlRequest
```

Edit `app/Http/Requests/UpdateMonitoredUrlRequest.php`:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMonitoredUrlRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('monitored_url'));
    }

    public function rules(): array
    {
        return [
            'url' => 'required|url|max:2048',
            'template_id' => 'required|exists:scraping_templates,id',
            'keywords' => 'required|array|min:1|max:20',
            'keywords.*' => 'required|string|max:100',
            'is_active' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'url.required' => '監視対象URLを入力してください',
            'url.url' => '有効なURLを入力してください',
            'template_id.required' => 'サイトタイプを選択してください',
            'template_id.exists' => '無効なサイトタイプです',
            'keywords.required' => 'キーワードを1つ以上入力してください',
            'keywords.min' => 'キーワードを1つ以上入力してください',
            'keywords.max' => 'キーワードは20個までです',
            'keywords.*.required' => 'キーワードを入力してください',
            'keywords.*.max' => 'キーワードは100文字以内です',
        ];
    }
}
```

**Step 3: Create controller**

```bash
php artisan make:controller MonitoredUrlController --resource
```

Edit `app/Http/Controllers/MonitoredUrlController.php`:

```php
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
```

**Step 4: Add routes**

Edit `routes/web.php` - add before `require __DIR__.'/auth.php';`:

```php
use App\Http\Controllers\MonitoredUrlController;

Route::middleware('auth')->group(function () {
    Route::resource('monitored-urls', MonitoredUrlController::class);
});
```

**Step 5: Commit**

```bash
git add app/Http/
git add routes/web.php
git commit -m "feat: add MonitoredUrl CRUD controller

- Form validation with custom error messages
- Authorization via policy
- Inertia responses

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Create React Components for MonitoredUrls

**Files:**
- Create: `resources/js/Pages/MonitoredUrls/Index.jsx`
- Create: `resources/js/Pages/MonitoredUrls/Create.jsx`
- Create: `resources/js/Pages/MonitoredUrls/Edit.jsx`
- Create: `resources/js/Components/KeywordInput.jsx`

**Step 1: Create KeywordInput component**

Create `resources/js/Components/KeywordInput.jsx`:

```jsx
import { useState } from 'react';

export default function KeywordInput({ keywords = [], onChange, error }) {
    const [items, setItems] = useState(keywords.length > 0 ? keywords : ['']);

    const handleAdd = () => {
        const newItems = [...items, ''];
        setItems(newItems);
        onChange(newItems);
    };

    const handleRemove = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        onChange(newItems);
    };

    const handleChange = (index, value) => {
        const newItems = [...items];
        newItems[index] = value;
        setItems(newItems);
        onChange(newItems);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                監視キーワード <span className="text-red-500">*</span>
            </label>

            <div className="space-y-2">
                {items.map((keyword, index) => (
                    <div key={index} className="flex gap-2">
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => handleChange(index, e.target.value)}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="キーワードを入力"
                        />
                        <button
                            type="button"
                            onClick={() => handleRemove(index)}
                            className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                            disabled={items.length === 1}
                        >
                            削除
                        </button>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={handleAdd}
                className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
                + キーワードを追加
            </button>

            {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}
```

**Step 2: Create Index page**

Create `resources/js/Pages/MonitoredUrls/Index.jsx`:

```jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ auth, monitoredUrls }) {
    const handleDelete = (id) => {
        if (confirm('本当に削除しますか？')) {
            router.delete(route('monitored-urls.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="監視URL一覧" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold">監視URL一覧</h2>
                                <Link
                                    href={route('monitored-urls.create')}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                    + 新しいURLを登録
                                </Link>
                            </div>

                            {monitoredUrls.length === 0 ? (
                                <p className="text-gray-500">まだ監視URLが登録されていません</p>
                            ) : (
                                <div className="space-y-4">
                                    {monitoredUrls.map((url) => (
                                        <div key={url.id} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg">
                                                        {url.template.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mt-1 break-all">
                                                        {url.url}
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {url.keywords.map((keyword, i) => (
                                                            <span
                                                                key={i}
                                                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                                            >
                                                                {keyword}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    {url.last_scraped_at && (
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            最終確認: {new Date(url.last_scraped_at).toLocaleString('ja-JP')}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    <Link
                                                        href={route('monitored-urls.edit', url.id)}
                                                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                                    >
                                                        編集
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(url.id)}
                                                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                                    >
                                                        削除
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

**Step 3: Create Create page**

Create `resources/js/Pages/MonitoredUrls/Create.jsx`:

```jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import KeywordInput from '@/Components/KeywordInput';

export default function Create({ auth, templates }) {
    const { data, setData, post, processing, errors } = useForm({
        url: '',
        template_id: '',
        keywords: [''],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('monitored-urls.store'));
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="監視URL登録" />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold mb-6">監視URL登録</h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        監視対象URL <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="url"
                                        value={data.url}
                                        onChange={(e) => setData('url', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="https://www.pref.mie.lg.jp/..."
                                    />
                                    {errors.url && (
                                        <p className="mt-1 text-sm text-red-600">{errors.url}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        サイトタイプ <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={data.template_id}
                                        onChange={(e) => setData('template_id', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">選択してください</option>
                                        {templates.map((template) => (
                                            <option key={template.id} value={template.id}>
                                                {template.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.template_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.template_id}</p>
                                    )}
                                </div>

                                <KeywordInput
                                    keywords={data.keywords}
                                    onChange={(keywords) => setData('keywords', keywords)}
                                    error={errors.keywords}
                                />

                                <div className="flex justify-end gap-3">
                                    <Link
                                        href={route('monitored-urls.index')}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                    >
                                        キャンセル
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        登録する
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

**Step 4: Create Edit page**

Create `resources/js/Pages/MonitoredUrls/Edit.jsx`:

```jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import KeywordInput from '@/Components/KeywordInput';

export default function Edit({ auth, monitoredUrl, templates }) {
    const { data, setData, put, processing, errors } = useForm({
        url: monitoredUrl.url,
        template_id: monitoredUrl.template_id,
        keywords: monitoredUrl.keywords,
        is_active: monitoredUrl.is_active,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('monitored-urls.update', monitoredUrl.id));
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="監視URL編集" />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold mb-6">監視URL編集</h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        監視対象URL <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="url"
                                        value={data.url}
                                        onChange={(e) => setData('url', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {errors.url && (
                                        <p className="mt-1 text-sm text-red-600">{errors.url}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        サイトタイプ <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={data.template_id}
                                        onChange={(e) => setData('template_id', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        {templates.map((template) => (
                                            <option key={template.id} value={template.id}>
                                                {template.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.template_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.template_id}</p>
                                    )}
                                </div>

                                <KeywordInput
                                    keywords={data.keywords}
                                    onChange={(keywords) => setData('keywords', keywords)}
                                    error={errors.keywords}
                                />

                                <div>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">有効</span>
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Link
                                        href={route('monitored-urls.index')}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                    >
                                        キャンセル
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        更新する
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

**Step 5: Update dashboard to show monitored URLs**

Edit `resources/js/Pages/Dashboard.jsx`:

```jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ auth }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">ダッシュボード</h2>}
        >
            <Head title="ダッシュボード" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h3 className="text-lg font-semibold mb-4">公募情報モニタリングシステム</h3>
                            <p className="mb-4">自治体サイトの公募情報を自動監視します。</p>

                            <div className="flex gap-4">
                                <Link
                                    href={route('monitored-urls.index')}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                    監視URL管理
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

**Step 6: Test in browser**

```bash
npm run dev
php artisan serve
```

1. Visit http://localhost:8000/register
2. Create account
3. Visit http://localhost:8000/monitored-urls
4. Click "新しいURLを登録"
5. Fill form and submit
6. Verify it appears in list
7. Test edit and delete

Expected: All CRUD operations work

**Step 7: Commit**

```bash
git add resources/js/
git commit -m "feat: add React UI for MonitoredUrl CRUD

- Index: list with edit/delete
- Create: form with keyword input
- Edit: form with active toggle
- KeywordInput: dynamic field addition/removal

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Create Scraper Service

**Files:**
- Create: `app/Services/ScraperService.php`
- Create: `app/Console/Commands/ScrapeCommand.php`

**Step 1: Create ScraperService**

Create `app/Services/ScraperService.php`:

```php
<?php

namespace App\Services;

use App\Models\DetectedOpportunity;
use App\Models\MonitoredUrl;
use App\Models\User;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;
use Symfony\Component\DomCrawler\Crawler;

class ScraperService
{
    private Client $client;
    private array $newOpportunitiesByUser = [];

    public function __construct()
    {
        $this->client = new Client([
            'timeout' => 30,
            'headers' => [
                'User-Agent' => 'KNT Monitoring Bot/1.0 (+https://your-domain.com/bot)',
            ],
        ]);
    }

    public function runAll(): void
    {
        Log::info('Scraping job started');

        $monitoredUrls = MonitoredUrl::where('is_active', true)
            ->with(['user', 'template'])
            ->get();

        foreach ($monitoredUrls as $monitoredUrl) {
            try {
                $this->scrapeUrl($monitoredUrl);
                sleep(2); // Be polite
            } catch (\Exception $e) {
                Log::error('Scraping failed', [
                    'monitored_url_id' => $monitoredUrl->id,
                    'url' => $monitoredUrl->url,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info('Scraping job completed', [
            'total_urls' => $monitoredUrls->count(),
            'users_to_notify' => count($this->newOpportunitiesByUser),
        ]);
    }

    private function scrapeUrl(MonitoredUrl $monitoredUrl): void
    {
        Log::info('Scraping started', [
            'monitored_url_id' => $monitoredUrl->id,
            'url' => $monitoredUrl->url,
        ]);

        try {
            $html = $this->fetchHtml($monitoredUrl->url);
        } catch (GuzzleException $e) {
            Log::error('HTTP request failed', [
                'monitored_url_id' => $monitoredUrl->id,
                'error' => $e->getMessage(),
            ]);
            return;
        }

        $opportunities = $this->parseHtml($html, $monitoredUrl);

        $newCount = 0;
        foreach ($opportunities as $opportunity) {
            if ($this->checkAndSave($opportunity, $monitoredUrl)) {
                $newCount++;
            }
        }

        $monitoredUrl->update(['last_scraped_at' => now()]);

        Log::info('Scraping completed', [
            'monitored_url_id' => $monitoredUrl->id,
            'opportunities_found' => count($opportunities),
            'new_opportunities' => $newCount,
        ]);
    }

    private function fetchHtml(string $url): string
    {
        $response = $this->client->get($url);
        return $response->getBody()->getContents();
    }

    private function parseHtml(string $html, MonitoredUrl $monitoredUrl): array
    {
        $crawler = new Crawler($html);
        $template = $monitoredUrl->template;
        $opportunities = [];

        try {
            $crawler->filter($template->list_selector)->each(function (Crawler $node) use ($template, $monitoredUrl, &$opportunities) {
                try {
                    $title = $node->filter($template->title_selector)->text();
                    $link = $node->filter($template->link_selector)->attr('href');

                    // Handle relative URLs
                    if (!str_starts_with($link, 'http')) {
                        $parsedUrl = parse_url($monitoredUrl->url);
                        $baseUrl = $parsedUrl['scheme'] . '://' . $parsedUrl['host'];
                        $link = $baseUrl . (str_starts_with($link, '/') ? $link : '/' . $link);
                    }

                    $date = null;
                    try {
                        $dateText = $node->filter($template->date_selector)->text();
                        $date = $this->parseDate($dateText);
                    } catch (\Exception $e) {
                        // Date parsing failed, continue without date
                    }

                    $department = null;
                    if ($template->department_selector) {
                        try {
                            $department = $node->filter($template->department_selector)->text();
                        } catch (\Exception $e) {
                            // Department not found, continue without it
                        }
                    }

                    // Check keyword matching
                    $matchedKeywords = $this->matchKeywords($title, $monitoredUrl->keywords);

                    if (count($matchedKeywords) > 0) {
                        $opportunities[] = [
                            'title' => $title,
                            'url' => $link,
                            'published_date' => $date,
                            'department' => $department,
                            'matched_keywords' => $matchedKeywords,
                        ];
                    }
                } catch (\Exception $e) {
                    // Skip this item if parsing fails
                    Log::warning('Failed to parse item', [
                        'monitored_url_id' => $monitoredUrl->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            });
        } catch (\Exception $e) {
            Log::error('Failed to parse HTML', [
                'monitored_url_id' => $monitoredUrl->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $opportunities;
    }

    private function matchKeywords(string $text, array $keywords): array
    {
        $matched = [];
        foreach ($keywords as $keyword) {
            if (str_contains($text, $keyword)) {
                $matched[] = $keyword;
            }
        }
        return $matched;
    }

    private function parseDate(string $dateText): ?string
    {
        // Remove Japanese era dates and convert to standard format
        $dateText = trim($dateText);

        // Try to parse common formats
        if (preg_match('/(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})/', $dateText, $matches)) {
            return sprintf('%04d-%02d-%02d', $matches[1], $matches[2], $matches[3]);
        }

        return null;
    }

    private function checkAndSave(array $opportunity, MonitoredUrl $monitoredUrl): bool
    {
        $hash = hash('sha256', $opportunity['url'] . $opportunity['title']);

        $exists = DetectedOpportunity::where('monitored_url_id', $monitoredUrl->id)
            ->where('content_hash', $hash)
            ->exists();

        if (!$exists) {
            $detected = DetectedOpportunity::create([
                'monitored_url_id' => $monitoredUrl->id,
                'title' => $opportunity['title'],
                'url' => $opportunity['url'],
                'published_date' => $opportunity['published_date'],
                'department' => $opportunity['department'],
                'matched_keywords' => $opportunity['matched_keywords'],
                'content_hash' => $hash,
            ]);

            // Track for email notification
            $userId = $monitoredUrl->user_id;
            if (!isset($this->newOpportunitiesByUser[$userId])) {
                $this->newOpportunitiesByUser[$userId] = [];
            }
            $this->newOpportunitiesByUser[$userId][] = $detected;

            Log::info('New opportunity detected', [
                'title' => $opportunity['title'],
                'matched_keywords' => $opportunity['matched_keywords'],
            ]);

            return true;
        }

        return false;
    }

    public function getNewOpportunitiesByUser(): array
    {
        return $this->newOpportunitiesByUser;
    }
}
```

**Step 2: Create Artisan command**

```bash
php artisan make:command ScrapeCommand
```

Edit `app/Console/Commands/ScrapeCommand.php`:

```php
<?php

namespace App\Console\Commands;

use App\Services\ScraperService;
use Illuminate\Console\Command;

class ScrapeCommand extends Command
{
    protected $signature = 'scrape:run';
    protected $description = 'Run web scraping for all active monitored URLs';

    public function handle(ScraperService $scraper): int
    {
        $this->info('Starting scraping job...');

        $scraper->runAll();

        $this->info('Scraping job completed!');

        return Command::SUCCESS;
    }
}
```

**Step 3: Test manually**

```bash
php artisan scrape:run
```

Expected: Logs show scraping attempted (will fail if no URLs registered)

**Step 4: Commit**

```bash
git add app/Services/ app/Console/Commands/
git commit -m "feat: add web scraping service

- ScraperService: HTML parsing with DOMCrawler
- Keyword matching and deduplication
- Error handling and logging
- Artisan command for manual execution

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 9: Create Email Notification

**Files:**
- Create: `app/Mail/OpportunitiesDetectedMail.php`
- Create: `resources/views/emails/opportunities-detected.blade.php`
- Modify: `app/Services/ScraperService.php`

**Step 1: Create Mailable**

```bash
php artisan make:mail OpportunitiesDetectedMail
```

Edit `app/Mail/OpportunitiesDetectedMail.php`:

```php
<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OpportunitiesDetectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public array $opportunities,
    ) {}

    public function envelope(): Envelope
    {
        $count = count($this->opportunities);
        return new Envelope(
            subject: "【{$count}件】新しい公募情報が見つかりました",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.opportunities-detected',
        );
    }
}
```

**Step 2: Create email view**

Create `resources/views/emails/opportunities-detected.blade.php`:

```blade
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 3px solid #4F46E5; padding-bottom: 10px; margin-bottom: 20px; }
        .opportunity { border: 1px solid #E5E7EB; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
        .opportunity-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .opportunity-meta { font-size: 14px; color: #6B7280; margin: 5px 0; }
        .keyword-tag { display: inline-block; background: #DBEAFE; color: #1E40AF; padding: 2px 8px; border-radius: 4px; margin-right: 5px; font-size: 12px; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px; }
        .footer { border-top: 1px solid #E5E7EB; padding-top: 15px; margin-top: 30px; font-size: 12px; color: #6B7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ count($opportunities) }}件の新しい公募情報が見つかりました</h1>
        </div>

        <p>こんにちは、{{ $user->name }}様</p>
        <p>本日のスクレイピングで以下の公募情報が新しく公開されました。</p>

        @foreach($opportunities as $index => $opportunity)
            <div class="opportunity">
                <div style="color: #6B7280; font-size: 12px; margin-bottom: 5px;">
                    案件 {{ $index + 1 }}/{{ count($opportunities) }}
                </div>

                <div class="opportunity-title">
                    {{ $opportunity->title }}
                </div>

                @if($opportunity->published_date)
                    <div class="opportunity-meta">
                        📅 公告日: {{ $opportunity->published_date->format('Y年m月d日') }}
                    </div>
                @endif

                @if($opportunity->department)
                    <div class="opportunity-meta">
                        🏢 担当課: {{ $opportunity->department }}
                    </div>
                @endif

                <div class="opportunity-meta">
                    🌐 監視元: {{ $opportunity->monitoredUrl->url }}
                </div>

                <div style="margin: 10px 0;">
                    🔍 マッチ:
                    @foreach($opportunity->matched_keywords as $keyword)
                        <span class="keyword-tag">{{ $keyword }}</span>
                    @endforeach
                </div>

                <a href="{{ $opportunity->url }}" class="button">詳細を確認</a>
            </div>
        @endforeach

        <div style="margin-top: 30px; text-align: center;">
            <p><a href="{{ route('opportunities.index') }}" style="color: #4F46E5;">▶ 管理画面で全ての履歴を確認</a></p>
            <p><a href="{{ route('monitored-urls.index') }}" style="color: #4F46E5;">▶ 監視設定を変更</a></p>
        </div>

        <div class="footer">
            <p>このメールは登録された監視設定に基づいて1日3回（8:00, 12:00, 17:00）送信されます。</p>
            <p>公募情報モニタリングシステム</p>
        </div>
    </div>
</body>
</html>
```

**Step 3: Update ScraperService to send emails**

Edit `app/Services/ScraperService.php` - add at end of `runAll()` method before the final Log::info:

```php
use App\Mail\OpportunitiesDetectedMail;
use Illuminate\Support\Facades\Mail;

// Add before final Log::info in runAll() method
foreach ($this->newOpportunitiesByUser as $userId => $opportunities) {
    $user = User::find($userId);
    if ($user) {
        try {
            Mail::to($user->email)->send(
                new OpportunitiesDetectedMail($user, $opportunities)
            );

            // Mark as notified
            foreach ($opportunities as $opportunity) {
                $opportunity->update(['notified_at' => now()]);
            }

            Log::info('Email sent', [
                'user_id' => $userId,
                'email' => $user->email,
                'opportunities_count' => count($opportunities),
            ]);
        } catch (\Exception $e) {
            Log::error('Email sending failed', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
```

**Step 4: Test email (in log mode)**

Ensure `.env` has:
```env
MAIL_MAILER=log
```

Register a monitored URL with real URL (e.g., https://www.pref.mie.lg.jp/common/07/all000179359.htm)

Run:
```bash
php artisan scrape:run
```

Check `storage/logs/laravel.log` for email content

Expected: Email logged with HTML content

**Step 5: Commit**

```bash
git add app/Mail/ app/Services/ resources/views/emails/
git commit -m "feat: add email notification for new opportunities

- Batch emails per user
- HTML template with opportunity details
- Marked as notified in DB

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 10: Create Opportunities Controller and Views

**Files:**
- Create: `app/Http/Controllers/OpportunityController.php`
- Create: `resources/js/Pages/Opportunities/Index.jsx`
- Modify: `routes/web.php`

**Step 1: Create controller**

```bash
php artisan make:controller OpportunityController
```

Edit `app/Http/Controllers/OpportunityController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\DetectedOpportunity;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OpportunityController extends Controller
{
    public function index(Request $request): Response
    {
        $query = DetectedOpportunity::query()
            ->with(['monitoredUrl.template', 'monitoredUrl.user'])
            ->whereHas('monitoredUrl', function ($query) {
                $query->where('user_id', auth()->id());
            })
            ->latest('created_at');

        // Keyword search
        if ($request->keyword) {
            $query->where('title', 'like', '%' . $request->keyword . '%');
        }

        $opportunities = $query->paginate(20);

        return Inertia::render('Opportunities/Index', [
            'opportunities' => $opportunities,
            'filters' => $request->only(['keyword']),
        ]);
    }
}
```

**Step 2: Add route**

Edit `routes/web.php` - add inside auth middleware group:

```php
use App\Http\Controllers\OpportunityController;

Route::get('/opportunities', [OpportunityController::class, 'index'])
    ->name('opportunities.index');
```

**Step 3: Create React component**

Create `resources/js/Pages/Opportunities/Index.jsx`:

```jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ auth, opportunities, filters }) {
    const [keyword, setKeyword] = useState(filters.keyword || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('opportunities.index'), { keyword }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleClearSearch = () => {
        setKeyword('');
        router.get(route('opportunities.index'), {}, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="検知履歴" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold mb-6">検知履歴</h2>

                            <form onSubmit={handleSearch} className="mb-6 flex gap-2">
                                <input
                                    type="text"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    placeholder="キーワードで検索..."
                                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                    検索
                                </button>
                                {filters.keyword && (
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                    >
                                        クリア
                                    </button>
                                )}
                            </form>

                            {opportunities.data.length === 0 ? (
                                <p className="text-gray-500">まだ検知された案件がありません</p>
                            ) : (
                                <>
                                    <div className="space-y-4 mb-6">
                                        {opportunities.data.map((opp) => (
                                            <div key={opp.id} className="border rounded-lg p-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="text-sm text-gray-500 mb-1">
                                                            {opp.published_date && (
                                                                <span className="mr-4">
                                                                    📅 {new Date(opp.published_date).toLocaleDateString('ja-JP')}
                                                                </span>
                                                            )}
                                                            {opp.department && (
                                                                <span className="mr-4">
                                                                    🏢 {opp.department}
                                                                </span>
                                                            )}
                                                            <span className="text-xs">
                                                                検知: {new Date(opp.created_at).toLocaleString('ja-JP')}
                                                            </span>
                                                        </div>

                                                        <h3 className="font-semibold text-lg mb-2">
                                                            {opp.title}
                                                        </h3>

                                                        <div className="text-sm text-gray-600 mb-2">
                                                            🌐 {opp.monitored_url.template.name}
                                                        </div>

                                                        <div className="flex flex-wrap gap-2 mb-2">
                                                            {opp.matched_keywords.map((keyword, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                                                                >
                                                                    🔍 {keyword}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <a
                                                        href={opp.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 whitespace-nowrap"
                                                    >
                                                        詳細ページへ ↗
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {opportunities.links.length > 3 && (
                                        <div className="flex justify-center gap-2">
                                            {opportunities.links.map((link, index) => (
                                                link.url ? (
                                                    <Link
                                                        key={index}
                                                        href={link.url}
                                                        preserveState
                                                        className={`px-3 py-2 rounded ${
                                                            link.active
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ) : (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-2 bg-gray-100 text-gray-400 rounded"
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                )
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

**Step 4: Update navigation**

Edit `resources/js/Layouts/AuthenticatedLayout.jsx` - add to navigation:

```jsx
<NavLink href={route('opportunities.index')} active={route().current('opportunities.index')}>
    検知履歴
</NavLink>
```

**Step 5: Update dashboard**

Edit `resources/js/Pages/Dashboard.jsx` - add link:

```jsx
<Link
    href={route('opportunities.index')}
    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
>
    検知履歴
</Link>
```

**Step 6: Test in browser**

Visit http://localhost:8000/opportunities

Expected: Shows list of detected opportunities (if any)

**Step 7: Commit**

```bash
git add app/Http/Controllers/ resources/js/ routes/
git commit -m "feat: add opportunities history view

- Paginated list of detected opportunities
- Keyword search
- Links to external opportunity pages

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 11: Setup Laravel Scheduler

**Files:**
- Modify: `routes/console.php`
- Create: documentation for cron setup

**Step 1: Configure scheduler**

Edit `routes/console.php`:

```php
<?php

use Illuminate\Support\Facades\Schedule;
use App\Services\ScraperService;

Schedule::call(function () {
    $scraper = app(ScraperService::class);
    $scraper->runAll();
})->dailyAt('08:00')->timezone('Asia/Tokyo');

Schedule::call(function () {
    $scraper = app(ScraperService::class);
    $scraper->runAll();
})->dailyAt('12:00')->timezone('Asia/Tokyo');

Schedule::call(function () {
    $scraper = app(ScraperService::class);
    $scraper->runAll();
})->dailyAt('17:00')->timezone('Asia/Tokyo');
```

**Step 2: Test scheduler locally**

```bash
# Test that scheduler recognizes tasks
php artisan schedule:list
```

Expected: Shows 3 scheduled tasks at 08:00, 12:00, 17:00

**Step 3: Test running scheduled tasks**

```bash
php artisan schedule:run
```

Expected: If current time matches, runs scraping. Otherwise shows "No scheduled commands are ready to run."

**Step 4: Create deployment docs**

Create `docs/DEPLOYMENT.md`:

```markdown
# Deployment Guide

## お名前.com 共有サーバー デプロイ手順

### 1. ローカルビルド

\`\`\`bash
composer install --no-dev --optimize-autoloader
npm install
npm run build
\`\`\`

### 2. サーバーアップロード

FTP/SFTPで以下を転送:
- プロジェクト全体 → `/home/your-account/travel-bid-watcher/`
- `public/*` → `/home/your-account/public_html/`

### 3. .env 設定

\`\`\`env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls
\`\`\`

### 4. SSH でマイグレーション

\`\`\`bash
cd /home/your-account/travel-bid-watcher
php artisan migrate --force
php artisan db:seed --class=ScrapingTemplateSeeder
chmod -R 777 storage bootstrap/cache
\`\`\`

### 5. Cron 設定

コントロールパネルから以下を設定:

**実行コマンド:**
\`\`\`
cd /home/your-account/travel-bid-watcher && php artisan schedule:run >> /dev/null 2>&1
\`\`\`

**実行間隔:** 毎分 (* * * * *)

Laravel Scheduler が自動で 8:00, 12:00, 17:00 に実行します。

### 6. .htaccess と index.php

`public_html/.htaccess`:
\`\`\`apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
\`\`\`

`public_html/index.php`:
\`\`\`php
<?php
define('LARAVEL_START', microtime(true));
require __DIR__.'/../travel-bid-watcher/vendor/autoload.php';
$app = require_once __DIR__.'/../travel-bid-watcher/bootstrap/app.php';
// ... rest of Laravel index.php
\`\`\`

### 7. 動作確認

1. ブラウザでアクセス
2. ユーザー登録
3. 監視URL登録
4. 手動実行: `php artisan scrape:run`
5. ログ確認: `tail -f storage/logs/laravel.log`
```

**Step 5: Commit**

```bash
git add routes/console.php docs/
git commit -m "feat: configure Laravel scheduler for 3x daily scraping

- Runs at 8:00, 12:00, 17:00 JST
- Add deployment documentation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 12: Add Tests

**Files:**
- Create: `tests/Feature/MonitoredUrlTest.php`
- Create: `tests/Feature/ScraperServiceTest.php`

**Step 1: Create MonitoredUrl feature test**

```bash
php artisan make:test MonitoredUrlTest
```

Edit `tests/Feature/MonitoredUrlTest.php`:

```php
<?php

namespace Tests\Feature;

use App\Models\MonitoredUrl;
use App\Models\ScrapingTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MonitoredUrlTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_view_their_monitored_urls(): void
    {
        $user = User::factory()->create();
        $template = ScrapingTemplate::factory()->create();
        $monitoredUrl = MonitoredUrl::factory()->create([
            'user_id' => $user->id,
            'template_id' => $template->id,
        ]);

        $response = $this->actingAs($user)->get(route('monitored-urls.index'));

        $response->assertStatus(200);
        $response->assertSee($monitoredUrl->url);
    }

    public function test_user_can_create_monitored_url(): void
    {
        $user = User::factory()->create();
        $template = ScrapingTemplate::factory()->create();

        $data = [
            'url' => 'https://www.example.com',
            'template_id' => $template->id,
            'keywords' => ['観光', 'インバウンド'],
        ];

        $response = $this->actingAs($user)->post(route('monitored-urls.store'), $data);

        $response->assertRedirect(route('monitored-urls.index'));
        $this->assertDatabaseHas('monitored_urls', [
            'user_id' => $user->id,
            'url' => 'https://www.example.com',
        ]);
    }

    public function test_user_cannot_edit_other_users_monitored_url(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $template = ScrapingTemplate::factory()->create();

        $monitoredUrl = MonitoredUrl::factory()->create([
            'user_id' => $user1->id,
            'template_id' => $template->id,
        ]);

        $response = $this->actingAs($user2)->put(
            route('monitored-urls.update', $monitoredUrl),
            ['url' => 'https://updated.com', 'template_id' => $template->id, 'keywords' => ['test']]
        );

        $response->assertForbidden();
    }

    public function test_keywords_validation_requires_at_least_one(): void
    {
        $user = User::factory()->create();
        $template = ScrapingTemplate::factory()->create();

        $response = $this->actingAs($user)->post(route('monitored-urls.store'), [
            'url' => 'https://www.example.com',
            'template_id' => $template->id,
            'keywords' => [],
        ]);

        $response->assertSessionHasErrors('keywords');
    }
}
```

**Step 2: Create factories**

```bash
php artisan make:factory ScrapingTemplateFactory
php artisan make:factory MonitoredUrlFactory
```

Edit `database/factories/ScrapingTemplateFactory.php`:

```php
<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ScrapingTemplateFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => $this->faker->word() . '型',
            'list_selector' => 'table tr',
            'title_selector' => 'td.title',
            'date_selector' => 'td.date',
            'link_selector' => 'a',
            'department_selector' => 'td.department',
        ];
    }
}
```

Edit `database/factories/MonitoredUrlFactory.php`:

```php
<?php

namespace Database\Factories;

use App\Models\ScrapingTemplate;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class MonitoredUrlFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'template_id' => ScrapingTemplate::factory(),
            'url' => $this->faker->url(),
            'keywords' => ['観光', 'インバウンド', '旅行'],
            'is_active' => true,
        ];
    }
}
```

**Step 3: Run tests**

```bash
php artisan test
```

Expected: All tests pass

**Step 4: Commit**

```bash
git add tests/ database/factories/
git commit -m "test: add feature tests for monitored URLs

- CRUD authorization tests
- Validation tests
- Factories for testing

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 13: Final Polish

**Files:**
- Modify: `README.md`
- Create: `.env.example`
- Update: dashboard with recent opportunities

**Step 1: Update README**

Edit `README.md`:

```markdown
# 公募情報モニタリングシステム (Travel Bid Watcher)

近畿日本ツーリスト向けの公募情報自動監視システム

自治体サイトの公募情報（企画提案コンペ等）を自動監視し、指定キーワードにマッチする案件が見つかった際にメール通知します。

## 主な機能

- 🔍 **Webスクレイピング** - 自治体サイトを自動巡回
- 📧 **メール通知** - 新規案件をまとめて通知
- 🗂️ **検知履歴** - 過去の案件を検索・閲覧
- ⚙️ **テンプレート管理** - サイト構造に応じた設定
- 🔐 **個人アカウント** - ユーザーごとの監視設定

## 技術スタック

- Laravel 11
- React 18 + Inertia.js
- Tailwind CSS
- MySQL
- Symfony DOMCrawler + GuzzleHttp

## セットアップ

### 1. 依存関係のインストール

\`\`\`bash
composer install
npm install
\`\`\`

### 2. 環境設定

\`\`\`bash
cp .env.example .env
php artisan key:generate
\`\`\`

`.env` を編集してデータベースとメール設定を入力:

\`\`\`env
DB_DATABASE=travel_bid_watcher
DB_USERNAME=root
DB_PASSWORD=

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
\`\`\`

### 3. データベース準備

\`\`\`bash
php artisan migrate
php artisan db:seed
\`\`\`

### 4. 開発サーバー起動

\`\`\`bash
# Terminal 1
php artisan serve

# Terminal 2
npm run dev
\`\`\`

http://localhost:8000 にアクセス

## 使い方

1. ユーザー登録
2. 「監視URL管理」から監視対象URLを登録
3. サイトタイプとキーワードを設定
4. 自動スクレイピング（1日3回: 8:00, 12:00, 17:00）を待つ
5. 新規案件があればメールで通知

## 手動スクレイピング実行

\`\`\`bash
php artisan scrape:run
\`\`\`

## テスト

\`\`\`bash
php artisan test
\`\`\`

## デプロイ

`docs/DEPLOYMENT.md` を参照

## 設計書

`docs/plans/2026-03-10-procurement-monitoring-system-design.md` を参照

## ライセンス

Proprietary - 近畿日本ツーリスト専用
```

**Step 2: Create .env.example**

```bash
cp .env .env.example
```

Edit `.env.example` to remove sensitive values:

```env
APP_NAME="公募情報モニタリング"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=travel_bid_watcher
DB_USERNAME=root
DB_PASSWORD=

MAIL_MAILER=log
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="${APP_NAME}"
```

**Step 3: Update Dashboard to show recent opportunities**

Edit `app/Http/Controllers/DashboardController.php` (create if not exists):

```bash
php artisan make:controller DashboardController
```

Edit `app/Http/Controllers/DashboardController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\DetectedOpportunity;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $recentOpportunities = DetectedOpportunity::query()
            ->with(['monitoredUrl.template'])
            ->whereHas('monitoredUrl', function ($query) {
                $query->where('user_id', auth()->id());
            })
            ->latest('created_at')
            ->limit(5)
            ->get();

        $monitoredUrls = auth()->user()
            ->monitoredUrls()
            ->with('template')
            ->where('is_active', true)
            ->get();

        return Inertia::render('Dashboard', [
            'recentOpportunities' => $recentOpportunities,
            'monitoredUrls' => $monitoredUrls,
        ]);
    }
}
```

Update `routes/web.php`:

```php
use App\Http\Controllers\DashboardController;

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');
```

Edit `resources/js/Pages/Dashboard.jsx`:

```jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ auth, recentOpportunities, monitoredUrls }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">ダッシュボード</h2>}
        >
            <Head title="ダッシュボード" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Recent Opportunities */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">🔔 最新の通知 ({recentOpportunities.length}件)</h3>

                            {recentOpportunities.length === 0 ? (
                                <p className="text-gray-500">まだ検知された案件がありません</p>
                            ) : (
                                <div className="space-y-3">
                                    {recentOpportunities.map((opp) => (
                                        <div key={opp.id} className="border-l-4 border-indigo-500 pl-4 py-2">
                                            <div className="text-sm text-gray-500">
                                                {new Date(opp.created_at).toLocaleDateString('ja-JP')} | {opp.monitored_url.template.name}
                                            </div>
                                            <div className="font-semibold">{opp.title}</div>
                                            <a
                                                href={opp.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-indigo-600 hover:underline"
                                            >
                                                詳細を見る ↗
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Link
                                href={route('opportunities.index')}
                                className="mt-4 inline-block text-indigo-600 hover:underline"
                            >
                                全ての履歴を見る →
                            </Link>
                        </div>
                    </div>

                    {/* Monitored URLs */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold mb-4">📋 監視中のURL ({monitoredUrls.length}件)</h3>

                            {monitoredUrls.length === 0 ? (
                                <p className="text-gray-500 mb-4">まだ監視URLが登録されていません</p>
                            ) : (
                                <div className="space-y-2 mb-4">
                                    {monitoredUrls.map((url) => (
                                        <div key={url.id} className="flex items-center justify-between border-b pb-2">
                                            <div>
                                                <div className="font-medium">{url.template.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    {url.last_scraped_at
                                                        ? `最終確認: ${new Date(url.last_scraped_at).toLocaleString('ja-JP')}`
                                                        : '未確認'}
                                                </div>
                                            </div>
                                            <Link
                                                href={route('monitored-urls.edit', url.id)}
                                                className="text-sm text-indigo-600 hover:underline"
                                            >
                                                編集
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Link
                                href={route('monitored-urls.create')}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 inline-block"
                            >
                                + 新しいURLを登録
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

**Step 4: Test complete flow**

1. Start servers: `php artisan serve` + `npm run dev`
2. Register new user
3. Create monitored URL
4. Run `php artisan scrape:run`
5. Check dashboard shows new opportunities
6. Check email in logs

Expected: Full flow works end-to-end

**Step 5: Final commit**

```bash
git add .
git commit -m "docs: update README and add enhanced dashboard

- Complete README with setup instructions
- Dashboard shows recent opportunities
- Dashboard shows monitored URLs status
- .env.example for easy setup

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Final Verification Checklist

Before marking complete, verify:

- [ ] User registration/login works
- [ ] MonitoredUrl CRUD works (create, edit, delete)
- [ ] Keyword input (add/remove fields) works
- [ ] Manual scraping: `php artisan scrape:run` succeeds
- [ ] Emails logged in `storage/logs/laravel.log`
- [ ] Opportunities list shows detected items
- [ ] Dashboard shows recent opportunities
- [ ] Tests pass: `php artisan test`
- [ ] Scheduler configured: `php artisan schedule:list`
- [ ] README is complete
- [ ] Deployment docs created

---

## Next Steps (Post-MVP)

After successful deployment:

1. Monitor logs for scraping errors
2. Add more scraping templates (Ise City, Toba City, etc.)
3. Fine-tune CSS selectors based on actual sites
4. Configure real SMTP for email delivery
5. Consider Phase 2 features (RSS support, Slack notifications)

---

**Implementation Plan Complete!**

Total estimated time: 8-12 hours for experienced developer
