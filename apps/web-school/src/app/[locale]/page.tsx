import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('dashboard');
  const nav = useTranslations('nav');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col items-center gap-8 px-8 py-16">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t('title')}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          {t('welcome', { name: 'Admin' })}
        </p>
        <nav className="flex flex-wrap gap-4">
          {(
            [
              'dashboard',
              'students',
              'teachers',
              'attendance',
              'fees',
              'exams',
              'timetable',
              'settings',
            ] as const
          ).map((key) => (
            <span
              key={key}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
            >
              {nav(key)}
            </span>
          ))}
        </nav>
      </main>
    </div>
  );
}
