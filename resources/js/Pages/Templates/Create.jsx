import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        selectors: {
            row: '',
            title: '',
            deadline: '',
            url: '',
            description: '',
            amount: '',
            location: '',
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('templates.store'));
    };

    const updateSelector = (key, value) => {
        setData('selectors', {
            ...data.selectors,
            [key]: value,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    テンプレート新規作成
                </h2>
            }
        >
            <Head title="テンプレート新規作成" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div>
                                <InputLabel htmlFor="name" value="テンプレート名 *" />
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
                                <InputLabel htmlFor="description" value="説明" />
                                <textarea
                                    id="description"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows="3"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                    CSSセレクタ設定
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <InputLabel htmlFor="selector_row" value="行セレクタ (row) *" />
                                        <TextInput
                                            id="selector_row"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.selectors.row}
                                            onChange={(e) => updateSelector('row', e.target.value)}
                                            required
                                            placeholder="table tbody tr"
                                        />
                                        <InputError message={errors['selectors.row']} className="mt-2" />
                                        <p className="mt-1 text-sm text-gray-500">
                                            案件リストの各行を選択するセレクタ
                                        </p>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="selector_title" value="タイトルセレクタ (title)" />
                                        <TextInput
                                            id="selector_title"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.selectors.title}
                                            onChange={(e) => updateSelector('title', e.target.value)}
                                            placeholder="td:nth-child(2)"
                                        />
                                        <InputError message={errors['selectors.title']} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="selector_deadline" value="期限セレクタ (deadline)" />
                                        <TextInput
                                            id="selector_deadline"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.selectors.deadline}
                                            onChange={(e) => updateSelector('deadline', e.target.value)}
                                            placeholder="td:nth-child(3)"
                                        />
                                        <InputError message={errors['selectors.deadline']} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="selector_url" value="URLセレクタ (url)" />
                                        <TextInput
                                            id="selector_url"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.selectors.url}
                                            onChange={(e) => updateSelector('url', e.target.value)}
                                            placeholder="td:nth-child(2) a"
                                        />
                                        <InputError message={errors['selectors.url']} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="selector_description" value="説明セレクタ (description)" />
                                        <TextInput
                                            id="selector_description"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.selectors.description}
                                            onChange={(e) => updateSelector('description', e.target.value)}
                                            placeholder="td.description"
                                        />
                                        <InputError message={errors['selectors.description']} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="selector_amount" value="金額セレクタ (amount)" />
                                        <TextInput
                                            id="selector_amount"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.selectors.amount}
                                            onChange={(e) => updateSelector('amount', e.target.value)}
                                            placeholder="td.amount"
                                        />
                                        <InputError message={errors['selectors.amount']} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="selector_location" value="場所セレクタ (location)" />
                                        <TextInput
                                            id="selector_location"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.selectors.location}
                                            onChange={(e) => updateSelector('location', e.target.value)}
                                            placeholder="td:nth-child(4)"
                                        />
                                        <InputError message={errors['selectors.location']} className="mt-2" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <Link
                                    href={route('templates.index')}
                                    className="text-sm text-gray-600 hover:text-gray-900"
                                >
                                    キャンセル
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    作成する
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
