import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Edit({ url, templates }) {
    const { data, setData, put, processing, errors } = useForm({
        name: url.name || '',
        url: url.url || '',
        template_id: url.template_id || '',
        notification_email: url.notification_email || '',
        keywords: url.keywords || [''],
        status: url.status || 'active',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('monitored-urls.update', url.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    監視URL編集
                </h2>
            }
        >
            <Head title="監視URL編集" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div>
                                <InputLabel htmlFor="name" value="名称 *" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    autoFocus
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="url" value="監視URL *" />
                                <TextInput
                                    id="url"
                                    type="url"
                                    className="mt-1 block w-full"
                                    value={data.url}
                                    onChange={(e) => setData('url', e.target.value)}
                                    required
                                />
                                <InputError message={errors.url} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="template_id" value="テンプレート *" />
                                <select
                                    id="template_id"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.template_id}
                                    onChange={(e) => setData('template_id', e.target.value)}
                                    required
                                >
                                    <option value="">選択してください</option>
                                    {templates.map((template) => (
                                        <option key={template.id} value={template.id}>
                                            {template.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.template_id} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="notification_email" value="通知先メールアドレス" />
                                <TextInput
                                    id="notification_email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    value={data.notification_email}
                                    onChange={(e) => setData('notification_email', e.target.value)}
                                />
                                <InputError message={errors.notification_email} className="mt-2" />
                                <p className="mt-1 text-sm text-gray-500">
                                    空欄の場合、登録ユーザーのメールアドレスに通知されます
                                </p>
                            </div>

                            <div>
                                <InputLabel value="フィルタリングキーワード" />
                                <div className="space-y-2 mt-1">
                                    {data.keywords.map((keyword, index) => (
                                        <div key={index} className="flex gap-2">
                                            <TextInput
                                                type="text"
                                                className="block w-full"
                                                value={keyword}
                                                onChange={(e) => {
                                                    const newKeywords = [...data.keywords];
                                                    newKeywords[index] = e.target.value;
                                                    setData('keywords', newKeywords);
                                                }}
                                                placeholder="例: インバウンド、旅行、海外"
                                            />
                                            {data.keywords.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newKeywords = data.keywords.filter((_, i) => i !== index);
                                                        setData('keywords', newKeywords);
                                                    }}
                                                    className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
                                                >
                                                    削除
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {data.keywords.length < 20 && (
                                    <button
                                        type="button"
                                        onClick={() => setData('keywords', [...data.keywords, ''])}
                                        className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                                    >
                                        + キーワードを追加
                                    </button>
                                )}
                                <InputError message={errors.keywords} className="mt-2" />
                                <p className="mt-1 text-sm text-gray-500">
                                    タイトルに含まれるキーワードで案件をフィルタリングします（最大20個）
                                </p>
                            </div>

                            <div>
                                <InputLabel htmlFor="status" value="ステータス *" />
                                <select
                                    id="status"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    required
                                >
                                    <option value="active">有効</option>
                                    <option value="paused">一時停止</option>
                                    <option value="error">エラー</option>
                                </select>
                                <InputError message={errors.status} className="mt-2" />
                                <p className="mt-1 text-sm text-gray-500">
                                    一時停止にすると監視が停止されます
                                </p>
                            </div>

                            {url.last_checked_at && (
                                <div className="rounded-md bg-gray-50 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg
                                                className="h-5 w-5 text-gray-400"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-gray-700">
                                                最終チェック:{' '}
                                                {new Date(url.last_checked_at).toLocaleString('ja-JP')}
                                            </p>
                                            {url.last_error && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    エラー: {url.last_error}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4">
                                <Link
                                    href={route('monitored-urls.index')}
                                    className="text-sm text-gray-600 hover:text-gray-900"
                                >
                                    キャンセル
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    更新する
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
