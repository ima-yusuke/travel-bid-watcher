import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ templates }) {
    const handleDelete = (id) => {
        if (confirm('本当にこのテンプレートを削除しますか？')) {
            router.delete(route('templates.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        スクレイピングテンプレート
                    </h2>
                    <Link href={route('templates.create')}>
                        <PrimaryButton>新規作成</PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title="テンプレート管理" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {templates.data.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">テンプレートが登録されていません</p>
                                    <Link href={route('templates.create')} className="mt-4 inline-block">
                                        <PrimaryButton>最初のテンプレートを作成</PrimaryButton>
                                    </Link>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    名称
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    説明
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    使用中のURL
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    操作
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {templates.data.map((template) => (
                                                <tr key={template.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-gray-900">
                                                            {template.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {template.description || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        {template.monitored_urls_count > 0 ? (
                                                            <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                                                                {template.monitored_urls_count}件
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">未使用</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                                        <div className="flex justify-end space-x-2">
                                                            <Link
                                                                href={route('templates.edit', template.id)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                            >
                                                                編集
                                                            </Link>
                                                            {template.monitored_urls_count === 0 && (
                                                                <button
                                                                    onClick={() => handleDelete(template.id)}
                                                                    className="text-red-600 hover:text-red-900"
                                                                >
                                                                    削除
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {templates.links && (
                                        <div className="mt-4 flex justify-center">
                                            <nav className="flex space-x-2">
                                                {templates.links.map((link, index) => (
                                                    <Link
                                                        key={index}
                                                        href={link.url || '#'}
                                                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                                                            link.active
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                                        } ${!link.url ? 'cursor-not-allowed opacity-50' : ''}`}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ))}
                                            </nav>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* セレクタの説明 */}
                    <div className="mt-6 overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                CSSセレクタについて
                            </h3>
                            <div className="space-y-2 text-sm text-gray-600">
                                <p><strong>row:</strong> 案件リストの各行を選択するセレクタ（必須）</p>
                                <p><strong>title:</strong> 案件タイトルを選択するセレクタ</p>
                                <p><strong>deadline:</strong> 期限を選択するセレクタ</p>
                                <p><strong>url:</strong> 詳細ページへのリンクを選択するセレクタ</p>
                                <p><strong>description:</strong> 案件説明を選択するセレクタ</p>
                                <p><strong>amount:</strong> 金額を選択するセレクタ</p>
                                <p><strong>location:</strong> 場所/部署を選択するセレクタ</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
