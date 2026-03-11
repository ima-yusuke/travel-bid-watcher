import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import DangerButton from '@/Components/DangerButton';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ urls, templates }) {
    const handleDelete = (id) => {
        if (confirm('本当にこの監視URLを削除しますか?')) {
            router.delete(route('monitored-urls.destroy', id));
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800',
            paused: 'bg-yellow-100 text-yellow-800',
            error: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        監視URL一覧
                    </h2>
                    <Link href={route('monitored-urls.create')}>
                        <PrimaryButton>新規登録</PrimaryButton>
                    </Link>
                </div>
            }
        >
            <Head title="監視URL一覧" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {urls.data.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">監視URLが登録されていません</p>
                                    <Link href={route('monitored-urls.create')} className="mt-4 inline-block">
                                        <PrimaryButton>最初のURLを登録</PrimaryButton>
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
                                                    テンプレート
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    ステータス
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    最終チェック
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    操作
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {urls.data.map((url) => (
                                                <tr key={url.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="font-medium text-gray-900">
                                                                {url.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500 truncate max-w-md">
                                                                {url.url}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900">
                                                        {url.template?.name || '-'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadge(
                                                                url.status,
                                                            )}`}
                                                        >
                                                            {url.status === 'active' && '有効'}
                                                            {url.status === 'paused' && '一時停止'}
                                                            {url.status === 'error' && 'エラー'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {url.last_checked_at
                                                            ? new Date(url.last_checked_at).toLocaleString('ja-JP')
                                                            : '未チェック'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                                        <div className="flex justify-end space-x-2">
                                                            <Link
                                                                href={route('monitored-urls.edit', url.id)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                            >
                                                                編集
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDelete(url.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                削除
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {urls.links && (
                                        <div className="mt-4 flex justify-center">
                                            <nav className="flex space-x-2">
                                                {urls.links.map((link, index) => (
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
