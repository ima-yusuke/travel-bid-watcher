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
            'name' => 'required|string|max:255',
            'url' => 'required|url|max:2048',
            'template_id' => 'required|exists:scraping_templates,id',
            'notification_email' => 'nullable|email|max:255',
            'keywords' => 'nullable|array|max:20',
            'keywords.*' => 'string|max:100',
            'status' => 'required|in:active,paused,error',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => '名称を入力してください',
            'url.required' => '監視対象URLを入力してください',
            'url.url' => '有効なURLを入力してください',
            'template_id.required' => 'テンプレートを選択してください',
            'template_id.exists' => '無効なテンプレートです',
            'notification_email.email' => '有効なメールアドレスを入力してください',
            'status.required' => 'ステータスを選択してください',
            'status.in' => '無効なステータスです',
        ];
    }
}
