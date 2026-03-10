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
