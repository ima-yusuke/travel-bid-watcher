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
                'name' => '沖縄観光コンベンションビューロー型',
                'description' => '沖縄観光コンベンションビューローの調達情報ページ用テンプレート',
                'selectors' => [
                    'row' => 'table.table-bordered tbody tr',
                    'title' => 'td:nth-child(2)',
                    'deadline' => 'td:nth-child(3)',
                    'url' => 'td:nth-child(2) a',
                    'description' => null,
                    'amount' => null,
                    'location' => 'td:nth-child(4)',
                ],
            ],
            [
                'name' => '三重県型',
                'description' => '三重県の入札情報ページ用テンプレート',
                'selectors' => [
                    'row' => 'table tr',
                    'title' => 'td.news-a a',
                    'deadline' => 'td.date-a',
                    'url' => 'td.news-a a',
                    'description' => null,
                    'amount' => null,
                    'location' => 'td.from-a a',
                ],
            ],
            [
                'name' => '汎用型（テーブル）',
                'description' => '一般的なテーブル形式のページ用テンプレート',
                'selectors' => [
                    'row' => 'table tbody tr',
                    'title' => 'td:nth-child(2)',
                    'deadline' => 'td:nth-child(1)',
                    'url' => 'a',
                    'description' => null,
                    'amount' => null,
                    'location' => 'td:nth-child(3)',
                ],
            ],
        ];

        foreach ($templates as $template) {
            ScrapingTemplate::create($template);
        }
    }
}
