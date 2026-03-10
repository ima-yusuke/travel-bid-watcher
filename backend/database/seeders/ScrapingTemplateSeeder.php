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
