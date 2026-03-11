import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create({ templates }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        url: '',
        template_id: '',
        notification_email: '',
        keywords: [''],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('monitored-urls.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    監視URL新規登録
                </h2>
            }
        >
            <Head title="監視URL新規登録" />

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
                                <p className="mt-1 text-sm text-gray-500">
                                    管理しやすい名前を付けてください
                                </p>
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
                                    placeholder="https://example.com/procurement"
                                />
                                <InputError message={errors.url} className="mt-2" />
                                <p className="mt-1 text-sm text-gray-500">
                                    監視対象のWebページURLを入力してください
                                </p>
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
                                <p className="mt-1 text-sm text-gray-500">
                                    ページ構造に合ったテンプレートを選択してください
                                </p>
                            </div>

                            <div>
                                <InputLabel htmlFor="notification_email" value="通知先メールアドレス" />
                                <TextInput
                                    id="notification_email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    value={data.notification_email}
                                    onChange={(e) => setData('notification_email', e.target.value)}
                                    placeholder="your-email@example.com"
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

                            <div className="flex items-center justify-between pt-4">
                                <Link
                                    href={route('monitored-urls.index')}
                                    className="text-sm text-gray-600 hover:text-gray-900"
                                >
                                    キャンセル
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    登録する
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
