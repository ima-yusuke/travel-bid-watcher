import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ opportunities, monitoredUrls, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [monitoredUrlId, setMonitoredUrlId] = useState(filters.monitored_url_id || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const formatDateWithDay = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        const weekday = weekdays[date.getDay()];
        return `${year}-${month}-${day} (${weekday})`;
    };

    const handleFilter = () => {
        router.get(
            route('opportunities.index'),
            {
                search,
                monitored_url_id: monitoredUrlId,
                date_from: dateFrom,
                date_to: dateTo,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearFilters = () => {
        setSearch('');
        setMonitoredUrlId('');
        setDateFrom('');
        setDateTo('');
        router.get(route('opportunities.index'));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    案件履歴
                </h2>
            }
        >
            <Head title="案件履歴" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Filters */}
                    <div className="mb-6 overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="mb-4 text-lg font-semibold">フィルター</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <InputLabel htmlFor="search" value="キーワード検索" />
                                    <TextInput
                                        id="search"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="タイトルで検索"
                                        onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                                    />
                                </div>

                                <div>
                                    <InputLabel htmlFor="monitored_url" value="監視URL" />
                                    <select
                                        id="monitored_url"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={monitoredUrlId}
                                        onChange={(e) => setMonitoredUrlId(e.target.value)}
                                    >
                                        <option value="">すべて</option>
                                        {monitoredUrls.map((url) => (
                                            <option key={url.id} value={url.id}>
                                                {url.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <InputLabel htmlFor="date_from" value="開始日" />
                                    <TextInput
                                        id="date_from"
                                        type="date"
                                        className="mt-1 block w-full"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <InputLabel htmlFor="date_to" value="終了日" />
                                    <TextInput
                                        id="date_to"
                                        type="date"
                                        className="mt-1 block w-full"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex space-x-2">
                                <button
                                    onClick={handleFilter}
                                    className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                                >
                                    検索
                                </button>
                                <button
                                    onClick={clearFilters}
                                    className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                                >
                                    クリア
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Opportunities List */}
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {opportunities.data.length === 0 ? (
                                <div className="py-12 text-center">
                                    <p className="text-gray-500">
                                        案件が見つかりませんでした
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4 text-sm text-gray-600">
                                        {opportunities.total}件中 {opportunities.from}-{opportunities.to}件を表示
                                    </div>

                                    <div className="space-y-4">
                                        {opportunities.data.map((opportunity) => (
                                            <div
                                                key={opportunity.id}
                                                className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                                            >
                                                <div className="mb-2 flex items-start justify-between">
                                                    <div className="flex-1">
                                                        {opportunity.full_url ? (
                                                            <a
                                                                href={opportunity.full_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-lg font-semibold text-indigo-600 hover:text-indigo-800"
                                                            >
                                                                {opportunity.title}
                                                            </a>
                                                        ) : (
                                                            <span className="text-lg font-semibold text-gray-900">
                                                                {opportunity.title}
                                                            </span>
                                                        )}
                                                        <div className="mt-1 text-sm text-gray-500">
                                                            {opportunity.monitored_url?.name}
                                                        </div>
                                                    </div>
                                                    <div className="ml-4 text-right text-sm text-gray-500">
                                                        {formatDateWithDay(opportunity.deadline) || formatDateWithDay(opportunity.created_at)}
                                                    </div>
                                                </div>

                                                {opportunity.description && (
                                                    <p className="mb-2 text-sm text-gray-600">
                                                        {opportunity.description.length > 200
                                                            ? opportunity.description.substring(0, 200) + '...'
                                                            : opportunity.description}
                                                    </p>
                                                )}

                                                <div className="flex flex-wrap gap-4 text-sm">
                                                    {opportunity.deadline && (
                                                        <div>
                                                            <span className="font-semibold text-gray-700">公開日: </span>
                                                            <span className="text-gray-600">{formatDateWithDay(opportunity.deadline)}</span>
                                                        </div>
                                                    )}
                                                    {opportunity.amount && (
                                                        <div>
                                                            <span className="font-semibold text-gray-700">金額: </span>
                                                            <span>{opportunity.amount}</span>
                                                        </div>
                                                    )}
                                                    {opportunity.location && (
                                                        <div>
                                                            <span className="font-semibold text-gray-700">場所: </span>
                                                            <span>{opportunity.location}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {opportunities.links && (
                                        <div className="mt-6 flex justify-center">
                                            <nav className="flex space-x-2">
                                                {opportunities.links.map((link, index) => (
                                                    <Link
                                                        key={index}
                                                        href={link.url || '#'}
                                                        className={`rounded-md px-3 py-2 text-sm font-medium ${
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
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
