# 公募情報モニタリングシステム 設計書

**作成日:** 2026年3月10日
**対象:** 近畿日本ツーリスト様
**技術スタック:** Laravel 11 + React 18 + Inertia.js + Tailwind CSS
**デプロイ環境:** お名前.com 共有レンタルサーバー

---

## 1. プロジェクト概要

### 目的
三重県や伊勢市などの自治体サイトに掲載される公募情報（企画提案コンペ等）を自動監視し、特定キーワード（インバウンド、観光、旅行、海外など）を含む案件が公開された際にメールで通知するシステム。

### 背景
現状、旅行会社の社員は各自治体のWebサイトを手動で確認する必要があり、新規案件の見逃しリスクがある。本システムにより自動監視を実現し、業務効率を改善する。

### スコープ（MVP）
- ユーザー個人アカウント制
- 監視URL登録機能（テンプレート選択方式）
- 1日3回の自動スクレイピング（8:00, 12:00, 17:00）
- 新規案件のメール通知（まとめて送信）
- 検知履歴の閲覧
- 10-15件のURL監視に最適化

---

## 2. システムアーキテクチャ

### 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| バックエンド | Laravel | 11.x |
| フロントエンド | React | 18.x |
| UI Bridge | Inertia.js | 1.x |
| スタイリング | Tailwind CSS | 3.x |
| データベース | MySQL | 5.7+ |
| スクレイピング | Symfony DOMCrawler | - |
| HTTP Client | GuzzleHttp | - |
| メール送信 | Laravel Mail (SMTP) | - |
| タスクスケジューラー | Laravel Scheduler + Cron | - |

### システム構成図

```
┌─────────────────────────────────────────────┐
│           ユーザー（ブラウザ）               │
└───────────────┬─────────────────────────────┘
                │ HTTPS
┌───────────────▼─────────────────────────────┐
│      お名前.com 共有レンタルサーバー          │
│  ┌─────────────────────────────────────┐   │
│  │  Laravel + Inertia.js + React       │   │
│  │                                     │   │
│  │  ┌──────────┐    ┌──────────────┐ │   │
│  │  │ Web UI   │◄───┤ Inertia.js   │ │   │
│  │  │ (React)  │    └──────────────┘ │   │
│  │  └──────────┘                      │   │
│  │                                     │   │
│  │  ┌──────────────────────────────┐  │   │
│  │  │  Laravel Backend             │  │   │
│  │  │  - 認証（Breeze）            │  │   │
│  │  │  - URL管理API                │  │   │
│  │  │  - 履歴閲覧API                │  │   │
│  │  └──────────────────────────────┘  │   │
│  │                                     │   │
│  │  ┌──────────────────────────────┐  │   │
│  │  │  Scheduler (Cron)            │  │   │
│  │  │  - 8:00, 12:00, 17:00 実行   │  │   │
│  │  │  - ScraperService 呼び出し   │  │   │
│  │  └──────────────────────────────┘  │   │
│  │           │                         │   │
│  │           ▼                         │   │
│  │  ┌──────────────────────────────┐  │   │
│  │  │  ScraperService               │  │   │
│  │  │  - URLを順次スクレイピング    │  │   │
│  │  │  - 新規案件検知               │  │   │
│  │  │  - メール送信                 │  │   │
│  │  └──────────────────────────────┘  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │         MySQL Database              │   │
│  │  - users                            │   │
│  │  - monitored_urls                   │   │
│  │  - scraping_templates               │   │
│  │  - detected_opportunities           │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                │
                ▼
    ┌───────────────────────┐
    │  外部サイト            │
    │  - 三重県              │
    │  - 伊勢市              │
    │  - 鳥羽市 etc.         │
    └───────────────────────┘
```

### 処理フロー

1. **ユーザー操作:** ブラウザから監視URLを登録
2. **自動監視:** Cronが1日3回 Laravel Scheduler を起動
3. **スクレイピング:** 登録された全URLを順次スクレイピング
4. **新規検知:** キーワードマッチした新規案件を検出
5. **通知:** ユーザーごとにまとめてメール送信
6. **履歴保存:** DBに保存し、管理画面で閲覧可能

---

## 3. データベース設計

### ER図

```
users (1) ───< (N) monitored_urls (N) >─── (1) scraping_templates
                         │
                         │ (1)
                         │
                         ▼
                       (N) detected_opportunities
```

### テーブル定義

#### users

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | bigint | PK, AUTO_INCREMENT | 主キー |
| name | varchar(255) | NOT NULL | ユーザー名 |
| email | varchar(255) | NOT NULL, UNIQUE | メールアドレス（ログイン用） |
| password | varchar(255) | NOT NULL | ハッシュ化パスワード |
| created_at | timestamp | | 作成日時 |
| updated_at | timestamp | | 更新日時 |

**インデックス:**
- PRIMARY KEY (id)
- UNIQUE KEY (email)

---

#### scraping_templates

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | bigint | PK, AUTO_INCREMENT | 主キー |
| name | varchar(100) | NOT NULL | テンプレート名（例: 三重県型） |
| list_selector | varchar(255) | NOT NULL | リストのCSSセレクター |
| title_selector | varchar(255) | NOT NULL | タイトルのCSSセレクター |
| date_selector | varchar(255) | NOT NULL | 日付のCSSセレクター |
| link_selector | varchar(255) | NOT NULL | リンクのCSSセレクター |
| department_selector | varchar(255) | NULLABLE | 担当課のCSSセレクター |
| created_at | timestamp | | 作成日時 |
| updated_at | timestamp | | 更新日時 |

**初期データ例:**
```sql
INSERT INTO scraping_templates (name, list_selector, title_selector, date_selector, link_selector, department_selector) VALUES
('三重県型', 'table tr', 'td.news-a a', 'td.date-a', 'td.news-a a', 'td.from-a a');
```

**インデックス:**
- PRIMARY KEY (id)

---

#### monitored_urls

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | bigint | PK, AUTO_INCREMENT | 主キー |
| user_id | bigint | NOT NULL, FK | ユーザーID（外部キー） |
| url | text | NOT NULL | 監視対象URL |
| template_id | bigint | NOT NULL, FK | テンプレートID（外部キー） |
| keywords | json | NOT NULL | 監視キーワード配列 |
| is_active | boolean | NOT NULL, DEFAULT 1 | 有効/無効フラグ |
| last_scraped_at | timestamp | NULLABLE | 最終スクレイピング日時 |
| created_at | timestamp | | 作成日時 |
| updated_at | timestamp | | 更新日時 |

**keywords カラムの例:**
```json
["インバウンド", "観光", "旅行", "海外"]
```

**インデックス:**
- PRIMARY KEY (id)
- INDEX (user_id)
- INDEX (template_id)
- INDEX (is_active)

**外部キー:**
- user_id → users.id (ON DELETE CASCADE)
- template_id → scraping_templates.id (ON DELETE RESTRICT)

---

#### detected_opportunities

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | bigint | PK, AUTO_INCREMENT | 主キー |
| monitored_url_id | bigint | NOT NULL, FK | 監視URL ID（外部キー） |
| title | text | NOT NULL | 案件タイトル |
| url | text | NOT NULL | 案件詳細URL |
| published_date | date | NULLABLE | 公告日 |
| department | varchar(255) | NULLABLE | 担当課（例: 教育総務課） |
| matched_keywords | json | NOT NULL | マッチしたキーワード配列 |
| content_hash | varchar(64) | NOT NULL | 重複防止用ハッシュ（SHA256） |
| notified_at | timestamp | NULLABLE | 通知送信日時 |
| created_at | timestamp | | 検知日時 |
| updated_at | timestamp | | 更新日時 |

**content_hash 生成ロジック:**
```php
$hash = hash('sha256', $url . $title);
```

**matched_keywords カラムの例:**
```json
["インバウンド", "観光"]
```

**インデックス:**
- PRIMARY KEY (id)
- INDEX (monitored_url_id)
- UNIQUE INDEX (monitored_url_id, content_hash) ← 重複防止
- INDEX (created_at) ← 履歴一覧で使用

**外部キー:**
- monitored_url_id → monitored_urls.id (ON DELETE CASCADE)

---

## 4. 機能設計

### 画面構成

#### A. 認証画面
- `/login` - ログイン画面
- `/register` - ユーザー登録画面
- Laravel Breeze + Inertia.js で実装

#### B. ダッシュボード (`/dashboard`)
**表示内容:**
- 最新の通知5件（新規検知案件）
- 監視中のURL一覧
- 各URLの最終スクレイピング日時

**アクション:**
- 新しいURLを登録
- URLの編集・削除

#### C. URL登録画面 (`/monitored-urls/create`)
**入力項目:**
- 監視対象URL（必須）
- サイトタイプ（ドロップダウン、必須）
- 監視キーワード（複数入力フィールド追加形式、必須）

**キーワード入力UI:**
```
┌─────────────────────────────────────────┐
│ 監視キーワード *                         │
│ ┌─────────────────────────────────────┐ │
│ │ [インバウンド                ] [削除]│ │
│ │ [観光                        ] [削除]│ │
│ │ [旅行                        ] [削除]│ │
│ │ [海外                        ] [削除]│ │
│ │                                     │ │
│ │ [+ キーワードを追加]                 │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### D. 検知履歴画面 (`/opportunities`)
**表示内容:**
- 全ての検知された案件
- 公告日、タイトル、担当課、マッチキーワード
- ページネーション（20件/ページ）

**検索・フィルター:**
- キーワード検索
- 日付範囲

---

### APIエンドポイント

#### 認証
- `POST /login` - ログイン
- `POST /register` - ユーザー登録
- `POST /logout` - ログアウト

#### 監視URL管理
- `GET /monitored-urls` - 一覧取得（Inertia）
- `GET /monitored-urls/create` - 登録画面（Inertia）
- `POST /monitored-urls` - 新規登録
- `GET /monitored-urls/{id}/edit` - 編集画面（Inertia）
- `PUT /monitored-urls/{id}` - 更新
- `DELETE /monitored-urls/{id}` - 削除

#### 検知履歴
- `GET /opportunities` - 一覧取得（Inertia、ページネーション）
- `GET /opportunities?keyword=観光` - キーワード検索
- `GET /opportunities/{id}` - 詳細（Inertia）

#### テンプレート
- `GET /api/templates` - テンプレート一覧取得（JSON、URL登録時のドロップダウン用）

#### Artisan コマンド
- `php artisan scrape:run` - 手動スクレイピング実行

---

## 5. スクレイピング処理設計

### スクレイピングフロー

```
┌─────────────────────────────────────────┐
│ Laravel Scheduler (Cron)                │
│ 実行時刻: 8:00, 12:00, 17:00            │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ ScraperService::runAll()                │
│ - 全アクティブなURLを取得               │
└──────────────┬──────────────────────────┘
               ▼
        ┌──────┴──────┐
        │  For Each   │
        │  URL (順次)  │
        └──────┬──────┘
               ▼
┌─────────────────────────────────────────┐
│ ScraperService::scrapeUrl($monitoredUrl)│
│ 1. URLにHTTPリクエスト (GuzzleHttp)      │
│ 2. テンプレートを取得                   │
│ 3. DOMCrawlerでパース                   │
│ 4. 各案件を抽出                         │
└──────────────┬──────────────────────────┘
               ▼
        ┌──────┴──────┐
        │  For Each   │
        │  案件       │
        └──────┬──────┘
               ▼
┌─────────────────────────────────────────┐
│ OpportunityDetector::check()            │
│ 1. キーワードマッチング判定             │
│ 2. content_hash生成                     │
│ 3. DB重複チェック                       │
└──────────────┬──────────────────────────┘
               ▼
          新規案件？
         /          \
       YES          NO
        │            │
        ▼            ▼
  ┌─────────┐   スキップ
  │ DB保存  │
  │（通知は │
  │後でまと │
  │めて）   │
  └─────────┘
               ▼
        全URL処理完了
               ▼
┌─────────────────────────────────────────┐
│ ユーザーごとに新規案件を集計             │
│ まとめてメール送信                       │
└─────────────────────────────────────────┘
```

### 新規案件の判定ロジック

```php
// 1. content_hashを計算
$hash = hash('sha256', $opportunityUrl . $title);

// 2. DBで重複チェック
$exists = DetectedOpportunity::where('monitored_url_id', $monitoredUrlId)
    ->where('content_hash', $hash)
    ->exists();

// 3. 判定
if (!$exists) {
    // 新規案件 → DB保存
    DetectedOpportunity::create([
        'monitored_url_id' => $monitoredUrlId,
        'title' => $title,
        'url' => $opportunityUrl,
        'published_date' => $date,
        'department' => $department,
        'matched_keywords' => $matchedKeywords,
        'content_hash' => $hash,
    ]);
}
```

### キーワードマッチングロジック

```php
// タイトルまたは本文にキーワードが含まれるかチェック
$matchedKeywords = [];
foreach ($keywords as $keyword) {
    if (str_contains($title, $keyword)) {
        $matchedKeywords[] = $keyword;
    }
}

// 1つ以上マッチしたら対象
if (count($matchedKeywords) > 0) {
    // 案件を保存
}
```

---

## 6. エラーハンドリング設計

### 想定されるエラーと対処

| エラー | 原因 | 対処 |
|-------|------|------|
| HTTP 404/500 | サイトがダウン、URL変更 | ログ記録、スキップして次へ |
| タイムアウト | サイトのレスポンス遅延 | 30秒でタイムアウト、1回リトライ |
| セレクター不一致 | サイトのHTML構造変更 | ログ記録（要テンプレート更新） |
| メール送信失敗 | SMTP設定ミス | ログ記録、failed_jobs に保存 |
| 実行時間オーバー | URL数が多すぎる | 全体で5分でタイムアウト |

### ログ設計

```php
// スクレイピング開始
Log::info('Scraping started', [
    'monitored_url_id' => $url->id,
    'url' => $url->url,
]);

// エラー発生
Log::error('Scraping failed', [
    'monitored_url_id' => $url->id,
    'url' => $url->url,
    'error' => $e->getMessage(),
    'stack_trace' => $e->getTraceAsString(),
]);

// 新規検知
Log::info('New opportunity detected', [
    'title' => $opportunity->title,
    'matched_keywords' => $opportunity->matched_keywords,
]);
```

### リトライ戦略

- **HTTPエラー:** 5秒後に1回リトライ、それでも失敗ならスキップ
- **メール送信:** 失敗時は `failed_jobs` テーブルに記録
- **全体タイムアウト:** スクレイピング全体で5分を超えたら中断

---

## 7. メール通知設計

### メール送信方式

**ユーザーごとにまとめて送信**
- スクレイピング完了後、ユーザーごとに新規案件を集計
- 1回の実行で1ユーザーにつき1通のメール
- 新規案件が0件の場合はメール送信しない

### メールテンプレート

**件名:**
```
【{件数}件】新しい公募情報が見つかりました
```

**本文:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   3件の新しい公募情報が見つかりました
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

こんにちは、{ユーザー名}様

本日のスクレイピングで以下の公募情報が
新しく公開されました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
案件 1/3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 インバウンド促進事業の企画提案コンペ
📅 公告日: 2026年3月10日
🏢 担当課: 教育総務課
🌐 監視元: 三重県 企画提案コンペ
🔍 マッチ: インバウンド, 観光

🔗 https://www.pref.mie.lg.jp/...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
案件 2/3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 観光振興コンペ募集
📅 公告日: 2026年3月9日
🏢 担当課: 観光課
🌐 監視元: 伊勢市 入札情報
🔍 マッチ: 観光, 旅行

🔗 https://www.city.ise.mie.jp/...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ 管理画面で全ての履歴を確認
  https://your-app.com/opportunities

▶ 監視設定を変更
  https://your-app.com/monitored-urls

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
このメールは登録された監視設定に基づいて
1日3回（8:00, 12:00, 17:00）送信されます。
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Laravel Mail設定

```php
// .env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@knt-monitoring.com
MAIL_FROM_NAME="公募情報モニタリング"
```

---

## 8. セキュリティ設計

### 認証・認可

| 項目 | 対策 |
|------|------|
| パスワード | bcryptハッシュ化（Laravel標準） |
| セッション | HTTPOnly Cookie、CSRF保護（Laravel標準） |
| 認証 | Laravel Breeze（セッションベース） |
| 認可 | Policyで制御（自分のURLのみ編集/削除可能） |

### 入力検証

```php
// MonitoredUrl作成時のバリデーション
$request->validate([
    'url' => 'required|url|max:2048',
    'template_id' => 'required|exists:scraping_templates,id',
    'keywords' => 'required|array|min:1|max:20',
    'keywords.*' => 'required|string|max:100',
]);
```

### XSS対策
- React + Inertia.js は自動エスケープ
- HTMLをレンダリングする箇所なし（全てテキスト表示）

### CSRF対策
- Laravel標準のCSRFトークン（全POSTリクエストに必須）

### SQLインジェクション対策
- Eloquent ORM使用（プリペアドステートメント）

### スクレイピングマナー

```php
// HTTPリクエスト時のUser-Agent設定
$client = new GuzzleHttp\Client([
    'timeout' => 30,
    'headers' => [
        'User-Agent' => 'KNT Monitoring Bot/1.0 (+https://your-domain.com/bot)',
    ],
]);
```

- 1日3回のみのアクセス（サーバー負荷を最小化）
- リクエスト間隔: 各URL間で2秒待機
- robots.txt を尊重

---

## 9. デプロイ設計（お名前.com共有サーバー）

### 必要な環境

- **PHP:** 8.1 以上
- **MySQL:** 5.7 以上
- **Composer:** 2.x
- **Node.js:** 18.x 以上（ローカルビルド時のみ）

### ディレクトリ構成

```
/home/your-account/
├── knt-monitoring/        # Laravelアプリ本体
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── resources/
│   ├── routes/
│   ├── storage/          # 書き込み権限 777
│   ├── .env
│   └── artisan
│
└── public_html/          # Webルート
    ├── index.php         # Laravel public/index.php
    ├── build/            # Vite ビルド済みアセット
    └── .htaccess
```

### デプロイ手順

#### 1. ローカルでビルド

```bash
# 依存関係インストール
composer install --no-dev --optimize-autoloader
npm install

# フロントエンドビルド
npm run build

# .env設定
cp .env.example .env
php artisan key:generate
```

#### 2. サーバーへアップロード

FTP/SFTPで以下を転送：
- `knt-monitoring/` → サーバーの `/home/your-account/knt-monitoring/`
- `public/` 配下 → `/home/your-account/public_html/`

#### 3. .env ファイル設定

```env
APP_NAME="公募情報モニタリング"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@knt-monitoring.com
MAIL_FROM_NAME="公募情報モニタリング"
```

#### 4. SSH接続してマイグレーション実行

```bash
cd /home/your-account/knt-monitoring

# マイグレーション実行
php artisan migrate --force

# 初期データ投入
php artisan db:seed --class=ScrapingTemplateSeeder

# storage権限設定
chmod -R 777 storage bootstrap/cache
```

#### 5. Cron設定

お名前.comのコントロールパネルから以下を設定：

```
分: *
時: *
日: *
月: *
曜日: *
コマンド: cd /home/your-account/knt-monitoring && php artisan schedule:run >> /dev/null 2>&1
```

#### 6. .htaccess 設定

`public_html/.htaccess`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect to index.php
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

`public_html/index.php` の修正:

```php
<?php

// Laravelアプリのパスを指定
define('LARAVEL_START', microtime(true));

require __DIR__.'/../knt-monitoring/vendor/autoload.php';

$app = require_once __DIR__.'/../knt-monitoring/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

$response->send();

$kernel->terminate($request, $response);
```

---

## 10. テスト方針（MVP）

### 手動テスト項目

#### 認証
- ✅ ユーザー登録
- ✅ ログイン
- ✅ ログアウト

#### URL管理
- ✅ URL登録（各テンプレートタイプ）
- ✅ キーワード追加・削除（複数フィールド）
- ✅ URL編集
- ✅ URL削除
- ✅ 他ユーザーのURL編集不可（認可テスト）

#### スクレイピング
- ✅ 手動実行（`php artisan scrape:run`）
- ✅ 新規案件の検知
- ✅ 重複案件のスキップ
- ✅ キーワードマッチング
- ✅ エラーハンドリング（存在しないURL）

#### メール
- ✅ メール送信確認
- ✅ まとめて送信（複数案件）
- ✅ 新規案件0件の場合は送信しない

#### 履歴
- ✅ 検知履歴の閲覧
- ✅ ページネーション
- ✅ キーワード検索

---

## 11. 将来の拡張案

MVPリリース後に検討する機能：

### Phase 2: 通知拡張
- **RSS対応** - RSS配信サイトへの対応
- **Slack/LINE通知** - メール以外の通知方法
- **通知設定のカスタマイズ** - 通知の時間帯設定

### Phase 3: 組織対応
- **チーム機能** - 支店・チーム単位での管理
- **ロール管理** - 支店長、副支店長、担当者などの権限分け
- **共有URL** - 複数ユーザーで同じURLを監視

### Phase 4: 高度な機能
- **キーワードの除外設定** - 特定キーワードを含む案件を除外
- **案件の既読/未読管理** - タスク管理機能
- **週次レポートメール** - 1週間の検知件数サマリー
- **スクレイピング失敗アラート** - サイト構造変更時の通知
- **AI要約機能** - 案件詳細の自動要約

### Phase 5: マルチテナント化
- **複数旅行会社対応** - SaaS化
- **カスタムドメイン** - 各社専用ドメイン
- **料金プラン** - 監視URL数に応じた課金

---

## 12. 制約事項と注意点

### 技術的制約

1. **お名前.com共有サーバーの制限**
   - PHPスクリプトの最大実行時間: 通常30-60秒
   - Queue Worker常時起動不可
   - Redis等のミドルウェア不可

2. **スクレイピングの限界**
   - HTMLスクレイピングのみ対応（MVP）
   - サイト構造変更時はテンプレート更新が必要
   - JavaScriptで動的生成されるコンテンツは取得不可

3. **スケーラビリティ**
   - 監視URL数: 10-15件に最適化
   - 50件以上の場合はVPS等への移行を推奨

### 運用上の注意点

1. **テンプレートメンテナンス**
   - 自治体サイトのリニューアル時はテンプレート更新が必要
   - 新しい自治体サイト追加時は開発者による設定が必要

2. **メール送信制限**
   - SMTPサーバーの送信制限に注意（Gmail: 1日500通）
   - 大量の案件検知時は分割送信を検討

3. **スクレイピングマナー**
   - 各自治体サイトへの負荷を考慮
   - アクセス頻度は1日3回まで

---

## 13. 成功指標（KPI）

### MVP評価指標

- **機能達成度:** 全ての基本機能が動作すること
- **見逃し防止:** 手動確認と比較して見逃しゼロ
- **業務効率:** 1日あたりの確認時間を80%削減
- **安定性:** 1週間連続で自動監視が動作すること

### 定量指標

- **監視URL数:** 10-15件
- **ユーザー数:** 5-10名
- **検知案件数:** 月間10-30件程度を想定
- **メール到達率:** 99%以上
- **システム稼働率:** 95%以上

---

## 14. プロジェクトタイムライン（想定）

本設計書に基づき、実装計画を別途作成します。

---

**設計書 終わり**
