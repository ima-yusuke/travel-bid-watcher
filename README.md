# 公募情報モニタリングシステム (Travel Bid Watcher)

近畿日本ツーリスト向けの公募情報自動監視システム

## セットアップ

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
```

## 開発サーバー

Laravel Sail (Docker) を使用:

```bash
# Sail を起動
./vendor/bin/sail up -d

# フロントエンド開発サーバーを起動
./vendor/bin/sail npm run dev

# アクセス: http://localhost
```

別のターミナルで:

```bash
# Sail コマンドのエイリアスを設定 (オプション)
alias sail='./vendor/bin/sail'

# その後は sail up, sail down などで操作可能
```

## テスト

```bash
./vendor/bin/sail artisan test
```

## 設計書

`../docs/plans/2026-03-10-procurement-monitoring-system-design.md` を参照

## 技術スタック

- Laravel 11
- React 18 + Inertia.js
- Tailwind CSS
- MySQL 8.0
- Docker (Laravel Sail)
