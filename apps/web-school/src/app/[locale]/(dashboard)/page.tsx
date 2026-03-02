'use client';

import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const { user } = useAuth();
  const role = user?.role ?? 'school_admin';

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('title')}</h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          {t('welcome', { name: user?.phone ?? '' })}
        </p>
      </div>

      {/* Stats grid — admin & vice_principal */}
      {(role === 'school_admin' || role === 'vice_principal') && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t('totalStudents')} value="—" color="blue" />
          <StatCard label={t('totalTeachers')} value="—" color="green" />
          <StatCard label={t('attendance')} value="—" color="amber" />
          <StatCard label={t('feeCollection')} value="—" color="purple" />
        </div>
      )}

      {/* Teacher view */}
      {role === 'teacher' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label={t('totalStudents')} value="—" color="blue" />
          <StatCard label={t('attendance')} value="—" color="amber" />
          <StatCard label={t('upcomingEvents')} value="—" color="green" />
        </div>
      )}

      {/* Parent view */}
      {role === 'parent' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label={t('attendance')} value="—" color="amber" />
          <StatCard label={t('announcements')} value="—" color="blue" />
        </div>
      )}

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            {t('announcements')}
          </h3>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">No announcements yet.</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            {t('upcomingEvents')}
          </h3>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">No upcoming events.</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorStyles: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
    green: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400',
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p
        className={`mt-2 inline-flex rounded-lg px-3 py-1 text-2xl font-bold ${colorStyles[color] ?? colorStyles.blue}`}
      >
        {value}
      </p>
    </div>
  );
}
