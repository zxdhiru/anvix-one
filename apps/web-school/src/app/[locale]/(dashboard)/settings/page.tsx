'use client';

import { useTranslations } from 'next-intl';

export default function SettingsPage() {
  const nav = useTranslations('nav');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{nav('settings')}</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">School Profile</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Manage school name, address, board, and other profile details.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Academic Year</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Configure academic years and terms.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Classes & Sections
          </h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Manage class structure and section assignments.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Subjects</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Configure subjects and class-subject mappings.
          </p>
        </div>
      </div>
    </div>
  );
}
