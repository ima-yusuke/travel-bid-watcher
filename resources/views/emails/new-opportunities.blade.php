<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>新しい調達情報</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        h1 {
            color: #4f46e5;
            margin: 0;
            font-size: 24px;
        }
        .subtitle {
            color: #6b7280;
            margin-top: 10px;
            font-size: 14px;
        }
        .opportunity {
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
            background-color: #fafafa;
        }
        .opportunity-title {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }
        .opportunity-detail {
            margin: 8px 0;
            font-size: 14px;
        }
        .opportunity-label {
            font-weight: 600;
            color: #6b7280;
            display: inline-block;
            min-width: 80px;
        }
        .opportunity-value {
            color: #374151;
        }
        .deadline {
            color: #dc2626;
            font-weight: 600;
        }
        .view-link {
            display: inline-block;
            margin-top: 10px;
            padding: 8px 16px;
            background-color: #4f46e5;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            font-size: 14px;
        }
        .view-link:hover {
            background-color: #4338ca;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
        .count-badge {
            background-color: #10b981;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 新しい調達情報が見つかりました</h1>
            <p class="subtitle">
                監視URL: <strong>{{ $monitoredUrl->name }}</strong>
            </p>
            <p class="subtitle">
                <span class="count-badge">{{ count($opportunities) }}件</span> の新しい情報があります
            </p>
        </div>

        @foreach ($opportunities as $opportunity)
            <div class="opportunity">
                <div class="opportunity-title">
                    {{ $opportunity->title }}
                </div>

                @if ($opportunity->description)
                    <div class="opportunity-detail">
                        <span class="opportunity-label">内容:</span>
                        <span class="opportunity-value">{{ Str::limit($opportunity->description, 200) }}</span>
                    </div>
                @endif

                @if ($opportunity->deadline)
                    <div class="opportunity-detail">
                        <span class="opportunity-label">期限:</span>
                        <span class="opportunity-value deadline">{{ $opportunity->deadline }}</span>
                    </div>
                @endif

                @if ($opportunity->amount)
                    <div class="opportunity-detail">
                        <span class="opportunity-label">金額:</span>
                        <span class="opportunity-value">{{ $opportunity->amount }}</span>
                    </div>
                @endif

                @if ($opportunity->location)
                    <div class="opportunity-detail">
                        <span class="opportunity-label">場所:</span>
                        <span class="opportunity-value">{{ $opportunity->location }}</span>
                    </div>
                @endif

                @if ($opportunity->url)
                    <a href="{{ $opportunity->url }}" class="view-link" target="_blank">
                        詳細を見る →
                    </a>
                @endif
            </div>
        @endforeach

        <div class="footer">
            <p>
                このメールは <strong>Travel Bid Watcher</strong> から自動送信されています。<br>
                監視設定の変更は
                <a href="{{ route('monitored-urls.index') }}" style="color: #4f46e5;">こちら</a>
                から行えます。
            </p>
        </div>
    </div>
</body>
</html>
