'use client';

import { useTranslations } from 'next-intl';

export default function TeachersPage() {
  const nav = useTranslations('nav');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{nav('teachers')}</h1>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          + Add Teacher
        </button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Teacher list will be loaded here. Connect to the API to fetch teacher data.
        </p>
      </div>
    </div>
  );
}
